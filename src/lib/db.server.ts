// Server-only: access to the Cloudflare D1 database (binding name: DB) and to secrets.
// Load this file only inside server handlers (it must never reach the browser bundle).

export interface D1ResultLike<T = unknown> {
  results: T[];
  success: boolean;
  meta: { changes?: number; last_row_id?: number };
}
export interface D1StatementLike {
  bind(...values: unknown[]): D1StatementLike;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1ResultLike<T>>;
  run(): Promise<D1ResultLike>;
}
export interface D1Like {
  prepare(query: string): D1StatementLike;
  batch<T = unknown>(statements: D1StatementLike[]): Promise<D1ResultLike<T>[]>;
}

type EnvBag = Record<string, unknown>;
const g = globalThis as unknown as { __EA_ENV__?: EnvBag; __env__?: EnvBag };

/** Called by src/server.ts on every request so server functions can reach the Worker bindings. */
export function rememberEnv(env: unknown) {
  if (env && typeof env === "object") g.__EA_ENV__ = env as EnvBag;
}

async function workerEnv(): Promise<EnvBag> {
  if (g.__EA_ENV__) return g.__EA_ENV__;
  if (g.__env__) return g.__env__;
  try {
    const specifier = "cloudflare:workers";
    const mod = (await import(/* @vite-ignore */ specifier)) as { env?: EnvBag };
    if (mod.env) return mod.env;
  } catch {
    /* not running inside Workers (tests, local vite dev) */
  }
  return {};
}

/** The D1 database, or null when no `DB` binding exists (the site then falls back to built-in content). */
export async function getDb(): Promise<D1Like | null> {
  const env = await workerEnv();
  const db = env["DB"] as D1Like | undefined;
  return db && typeof db.prepare === "function" ? db : null;
}

/** A secret / variable by name: Worker env first, then process.env (nodejs_compat). */
export async function getSecret(name: string): Promise<string | undefined> {
  const env = await workerEnv();
  const v = env[name];
  if (typeof v === "string" && v) return v;
  const p = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return p || undefined;
}

/** Every variable the email notifier needs, in the shape booking-notify.server.ts expects. */
export async function getRuntimeEnv(): Promise<Record<string, string | undefined>> {
  const names = ["BOOKING_WEBHOOK_URL", "BOOKING_WEBHOOK_SECRET"];
  const out: Record<string, string | undefined> = {};
  for (const n of names) out[n] = await getSecret(n);
  return out;
}

export const nowIso = () => new Date().toISOString();
