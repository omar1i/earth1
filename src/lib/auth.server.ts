// Server-only: administrator authentication (PBKDF2 password hashes, hashed session tokens, cookies).
import type { D1Like } from "./db.server";

export const SESSION_COOKIE = "ea_admin";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const PBKDF2_ITERATIONS = 100_000; // Cloudflare Workers allows at most 100,000 for PBKDF2
const MAX_FAILED_LOGINS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const enc = new TextEncoder();
const b64 = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (bytes: Uint8Array) => b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterations || !salt || !hash) return false;
  const n = Number(iterations);
  if (!Number.isInteger(n) || n < 1000 || n > PBKDF2_ITERATIONS) return false;
  const actual = await pbkdf2(password, unb64(salt), n);
  return safeEqual(actual, unb64(hash));
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters.";
  if (password.length > 200) return "Password is too long.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Use letters and at least one number.";
  return null;
}

const sha256Hex = async (text: string) => hex(await crypto.subtle.digest("SHA-256", enc.encode(text)));

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function sessionCookie(token: string, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${secure}`;
}
export function clearSessionCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export type AdminSession = { userId: number; username: string };

export async function createSession(db: D1Like, userId: number): Promise<string> {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await db
    .prepare("INSERT INTO admin_sessions (token_hash, user_id, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)")
    .bind(await sha256Hex(token), userId, now + SESSION_MS, now)
    .run();
  // Opportunistic clean-up of expired sessions and old login attempts.
  await db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?1").bind(now).run();
  await db.prepare("DELETE FROM login_attempts WHERE attempted_at < ?1").bind(now - LOGIN_WINDOW_MS).run();
  return token;
}

export async function getSession(db: D1Like, request: Request): Promise<AdminSession | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || token.length < 20 || token.length > 100) return null;
  const row = await db
    .prepare(
      `SELECT u.id AS id, u.username AS username FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ?1 AND s.expires_at > ?2`,
    )
    .bind(await sha256Hex(token), Date.now())
    .first<{ id: number; username: string }>();
  return row ? { userId: row.id, username: row.username } : null;
}

export async function destroySession(db: D1Like, request: Request): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?1").bind(await sha256Hex(token)).run();
}

export async function destroyOtherSessions(db: D1Like, userId: number, request: Request): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  const keep = token ? await sha256Hex(token) : "";
  await db.prepare("DELETE FROM admin_sessions WHERE user_id = ?1 AND token_hash <> ?2").bind(userId, keep).run();
}

export function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function tooManyFailures(db: D1Like, ip: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ?1 AND attempted_at > ?2")
    .bind(ip, Date.now() - LOGIN_WINDOW_MS)
    .first<{ n: number }>();
  return (row?.n ?? 0) >= MAX_FAILED_LOGINS;
}
export async function recordFailure(db: D1Like, ip: string): Promise<void> {
  await db.prepare("INSERT INTO login_attempts (ip, attempted_at) VALUES (?1, ?2)").bind(ip, Date.now()).run();
}
export async function clearFailures(db: D1Like, ip: string): Promise<void> {
  await db.prepare("DELETE FROM login_attempts WHERE ip = ?1").bind(ip).run();
}

/** Same-origin check for state-changing requests (defence in depth on top of SameSite=Strict). */
export function sameOriginOk(request: Request): boolean {
  if (request.headers.get("x-requested-with") !== "ea-admin") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/** Dummy hash used to keep login timing similar when the username does not exist. */
export const DUMMY_HASH = "pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
