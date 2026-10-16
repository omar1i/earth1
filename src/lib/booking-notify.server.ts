// Server-only: e-mails a saved booking through Resend (https://resend.com).
//   1. The owner always gets the booking details (to BOOKING_NOTIFY_TO).
//   2. OPTIONALLY the customer gets a "preliminarily confirmed" message with the bank transfer
//      details, when BANK_DETAILS is set and the customer gave an e-mail address.
// The API key comes from a server secret and must never be imported into client code. Only load
// this file inside server function handlers.
import { experiences, groupTrips, privateDestinations } from "./content";
import type { BookingInput } from "./booking-schema";
import { getRuntimeEnv } from "./db.server";
import { DEFAULT_SITE_URL, renderCustomerEmail, renderOwnerEmail, type EmailData } from "./booking-email-template";

const RESEND_URL = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 750;
const DEFAULT_FROM = "Earth Adventure <onboarding@resend.dev>";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NotifyFailure = "not_configured" | "timeout" | "network" | "http_error" | "rejected";
export type NotifyResult = { sent: true } | { sent: false; reason: NotifyFailure };

type NotifyOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
  /** Trip name from the database; used in the e-mail instead of the built-in content lookup. */
  tripName?: string;
  /** Human-readable departure (group trips), e.g. "20-21 November 2026 08:00". */
  departure?: string;
  /** Manual "resend e-mail" from the dashboard: use a fresh idempotency key for the owner e-mail. */
  fresh?: boolean;
};

type Mail = { to: string[]; subject: string; text: string; html?: string; replyTo?: string };
type Attempt = NotifyResult & { retryable?: boolean };

// Coerce to text, cap the length, and (unless multiline is allowed) remove line breaks so a
// customer cannot smuggle extra lines into a subject.
function clean(value: unknown, max: number, multiline = false): string {
  let s = value === undefined || value === null ? "" : String(value);
  s = multiline
    ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    : s.replace(/[\u0000-\u001F\u007F]+/g, " ");
  return s.trim().slice(0, max);
}

function tripNameOf(booking: BookingInput, options: NotifyOptions): string {
  const experience = [...privateDestinations, ...experiences, ...groupTrips].find(
    (e) => e.id === booking.experience_id,
  );
  return clean(options.tripName ?? experience?.name.en ?? booking.experience_id, 120);
}

function buildCustomerMail(
  booking: BookingInput,
  trip: string,
  bankDetails: string,
  departure: string,
): Mail {
  const arabic = booking.preferred_language === "ar";
  const bank = bankDetails.replace(/\s*\|\s*/g, "\n").trim();
  const name = clean(booking.customer_name, 100);
  const date = clean(booking.preferred_date, 20);
  const people = clean(booking.participant_count, 6);
  const ref = booking.submission_key;
  if (arabic) {
    return {
      to: [booking.email!],
      subject: "Earth Adventure - تم تأكيد حجزك مبدئيًا",
      text: [
        `مرحبًا ${name}،`, "",
        "شكرًا لاختيارك Earth Adventure. تم تأكيد حجزك مبدئيًا.", "",
        `الرحلة: ${trip}`,
        ...(departure ? [`الموعد: ${departure}`] : []),
        `التاريخ المفضل: ${date}`, `عدد المشاركين: ${people}`, `رقم الحجز: ${ref}`, "",
        "بيانات التحويل البنكي:", bank, "",
        "لأي استفسار يمكنك الرد على هذه الرسالة.",
      ].join("\n"),
    };
  }
  return {
    to: [booking.email!],
    subject: "Earth Adventure - your booking is preliminarily confirmed",
    text: [
      `Hello ${name},`, "",
      "Thank you for choosing Earth Adventure. Your booking is preliminarily confirmed.", "",
      `Experience: ${trip}`,
      ...(departure ? [`Departure: ${departure}`] : []),
      `Preferred date: ${date}`, `Participants: ${people}`, `Booking reference: ${ref}`, "",
      "Bank transfer details:", bank, "",
      "If you have any questions, simply reply to this email.",
    ].join("\n"),
  };
}

function buildOwnerMail(
  booking: BookingInput,
  trip: string,
  departure: string,
  to: string[],
  customer: "sent" | "skipped" | "failed",
): Mail {
  const phone = clean(booking.contact_number, 40);
  const email = clean(booking.email, 255);
  const digits = phone.replace(/[^0-9]/g, "");
  const action =
    customer === "sent"
      ? "Bank transfer details were emailed to the customer automatically."
      : "ACTION NEEDED: send the bank transfer details to the customer now (WhatsApp link below)." +
        (customer === "failed" ? " (The automatic email to the customer failed.)" : "");
  const lines = [
    "NEW BOOKING - preliminarily confirmed",
    action,
    "",
    `Experience: ${trip} (${clean(booking.experience_id, 100)})`,
    ...(departure ? [`Departure: ${clean(departure, 80)}`] : []),
    `Preferred date: ${clean(booking.preferred_date, 20)}`,
    `Participants: ${clean(booking.participant_count, 6)}`,
    "",
    `Name: ${clean(booking.customer_name, 100)}`,
    `Phone: ${phone}`,
    ...(digits ? [`WhatsApp: https://api.whatsapp.com/send?phone=${digits}`] : []),
    `Email: ${email || "(not provided)"}`,
    `Preferred language: ${booking.preferred_language === "ar" ? "Arabic" : "English"}`,
    "",
    `Special requirements: ${clean(booking.special_requirements, 2000, true) || "-"}`,
    `Additional notes: ${clean(booking.additional_notes, 2000, true) || "-"}`,
    "",
    `Terms & Conditions accepted: ${booking.terms_accepted === true ? "yes" : "NO"}`,
    `Submitted (UTC): ${new Date().toISOString()}`,
    `Reference: ${booking.submission_key}`,
  ];
  return {
    to,
    subject: `New booking: ${clean(trip, 80)} - ${clean(booking.preferred_date, 20)} - ${clean(booking.customer_name, 60)}`,
    text: lines.join("\n"),
    // Replying in your mail app goes straight to the customer when they gave an e-mail address.
    ...(EMAIL_RE.test(email) ? { replyTo: email } : {}),
  };
}

async function attempt(
  mail: Mail,
  from: string,
  apiKey: string,
  idempotencyKey: string,
  fetchImpl: typeof fetch,
): Promise<Attempt> {
  try {
    const response = await fetchImpl(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Resend returns the first result for a repeated key (24 h), so a retry after a lost
        // response cannot produce a second e-mail.
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        ...(mail.html ? { html: mail.html } : {}),
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      // Log only the status and Resend's error name (e.g. "invalid_api_key"): never the message,
      // which can contain e-mail addresses.
      const body = (await response.json().catch(() => null)) as { name?: unknown } | null;
      const name = typeof body?.name === "string" ? body.name.slice(0, 60) : "";
      console.error(`[booking-email] Resend answered ${response.status}${name ? ` (${name})` : ""}.`);
      return {
        sent: false,
        reason: "http_error",
        retryable: response.status >= 500 || response.status === 429 || response.status === 409,
      };
    }
    const parsed = (await response.json().catch(() => null)) as { id?: unknown } | null;
    if (typeof parsed?.id === "string" && parsed.id) return { sent: true };
    return { sent: false, reason: "rejected" };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return { sent: false, reason: timedOut ? "timeout" : "network", retryable: true };
  }
}

/**
 * Sends the booking notification. Never throws: the booking is already saved by the time this
 * runs, so an email problem must not turn into a failed submission for the customer.
 * Logs only the reference and a failure reason (no personal data, address, or API key).
 */
export async function notifyBooking(
  booking: BookingInput,
  options: NotifyOptions = {},
): Promise<NotifyResult> {
  const env = options.env ?? (await getRuntimeEnv());
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiKey = env["RESEND_API_KEY"];
  const to = (env["BOOKING_NOTIFY_TO"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => EMAIL_RE.test(s));

  if (!apiKey || to.length === 0) {
    console.warn(
      `[booking-email] Not configured; booking ${booking.submission_key} saved without email.`,
    );
    return { sent: false, reason: "not_configured" };
  }

  const from = env["BOOKING_FROM_EMAIL"]?.trim() || DEFAULT_FROM;
  const bankDetails = (env["BANK_DETAILS"] ?? "").trim();
  const trip = tripNameOf(booking, options);
  const departure = clean(options.departure ?? "", 80);
  const retryDelay = options.retryDelayMs ?? RETRY_DELAY_MS;
  const siteUrl = (env["SITE_URL"] ?? "").trim() || DEFAULT_SITE_URL;
  const emailData: EmailData = {
    ref: booking.submission_key, name: clean(booking.customer_name, 100), phone: clean(booking.contact_number, 40),
    email: clean(booking.email, 255), date: clean(booking.preferred_date, 20), people: clean(booking.participant_count, 6),
    language: booking.preferred_language === "ar" ? "ar" : "en", trip, departure,
    requirements: clean(booking.special_requirements, 2000, true), notes: clean(booking.additional_notes, 2000, true),
    termsAccepted: booking.terms_accepted === true, submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  };

  // Customer e-mail first (best effort, one attempt), so the owner's e-mail can say what happened.
  // A customer-mail problem must never stop the owner's e-mail from being sent.
  let customer: "sent" | "skipped" | "failed" = "skipped";
  const customerAddress = clean(booking.email, 255);
  if (bankDetails && EMAIL_RE.test(customerAddress)) {
    const mail = {
      ...buildCustomerMail(booking, trip, bankDetails, departure),
      html: renderCustomerEmail(emailData, bankDetails, { siteUrl }),
      // The customer's "reply" reaches the business, not the sender address.
      ...(to[0] ? { replyTo: to[0] } : {}),
    };
    const r = await attempt(mail, from, apiKey, `customer-${booking.submission_key}`, fetchImpl);
    customer = r.sent ? "sent" : "failed";
    if (!r.sent) {
      console.error(`[booking-email] Customer e-mail FAILED (${r.reason}) for booking ${booking.submission_key}.`);
    }
  }

  const ownerMail = {
    ...buildOwnerMail(booking, trip, departure, to, customer),
    html: renderOwnerEmail(emailData, customer, { siteUrl }),
  };
  const ownerKey = `owner-${booking.submission_key}${options.fresh ? `-${Date.now()}` : ""}`;
  let result = await attempt(ownerMail, from, apiKey, ownerKey, fetchImpl);

  // One retry for transient failures (same idempotency key, same body).
  if (!result.sent && result.retryable) {
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    result = await attempt(ownerMail, from, apiKey, ownerKey, fetchImpl);
  }

  if (!result.sent) {
    console.error(`[booking-email] FAILED (${result.reason}) for booking ${booking.submission_key}.`);
    return { sent: false, reason: result.reason };
  }
  return { sent: true };
}
