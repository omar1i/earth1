// Server-only: sends a saved booking to the owner's Gmail through a Google Apps Script web app.
// The webhook URL and secret come from server environment variables and must never be
// imported into client code. Only load this file inside server function handlers.
import { experiences } from "./content";
import type { BookingInput } from "./booking-schema";

const REQUEST_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 750;

export type NotifyFailure = "not_configured" | "timeout" | "network" | "http_error" | "rejected";
export type NotifyResult = { sent: true } | { sent: false; reason: NotifyFailure };

type NotifyOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
};

function buildPayload(booking: BookingInput, secret: string) {
  const experience = experiences.find((e) => e.id === booking.experience_id);
  return {
    secret,
    reference: booking.submission_key,
    experience_id: booking.experience_id,
    experience_name: experience?.name.en ?? booking.experience_id,
    customer_name: booking.customer_name,
    contact_number: booking.contact_number,
    email: booking.email || "",
    preferred_date: booking.preferred_date,
    participant_count: booking.participant_count,
    preferred_language: booking.preferred_language,
    special_requirements: booking.special_requirements || "",
    additional_notes: booking.additional_notes || "",
    terms_accepted: booking.terms_accepted,
    submitted_at: new Date().toISOString(),
  };
}

async function attempt(
  url: string,
  body: string,
  fetchImpl: typeof fetch,
): Promise<NotifyResult & { retryable?: boolean }> {
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      // text/plain keeps the request "simple"; Apps Script reads the raw body either way.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { sent: false, reason: "http_error", retryable: response.status >= 500 };
    }
    // A misconfigured deployment (e.g. "Only me") answers 200 with an HTML sign-in page,
    // so success is only trusted when the script itself answers {"ok":true}.
    const parsed = (await response.json().catch(() => null)) as { ok?: unknown } | null;
    if (parsed?.ok === true) return { sent: true };
    return { sent: false, reason: "rejected" };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return { sent: false, reason: timedOut ? "timeout" : "network", retryable: true };
  }
}

/**
 * Sends the booking notification. Never throws: the booking is already saved by the time this
 * runs, so an email problem must not turn into a failed submission for the customer.
 * Logs only the reference and a failure reason (no personal data, URL, or secret).
 */
export async function notifyBooking(
  booking: BookingInput,
  options: NotifyOptions = {},
): Promise<NotifyResult> {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = env["BOOKING_WEBHOOK_URL"];
  const secret = env["BOOKING_WEBHOOK_SECRET"];

  if (!url || !secret) {
    console.warn(
      `[booking-email] Not configured; booking ${booking.submission_key} saved without email.`,
    );
    return { sent: false, reason: "not_configured" };
  }

  const body = JSON.stringify(buildPayload(booking, secret));
  let result = await attempt(url, body, fetchImpl);

  // One retry for transient failures. The Apps Script de-duplicates by reference,
  // so a retry after a lost response cannot produce a second email.
  if (!result.sent && result.retryable) {
    await new Promise((resolve) => setTimeout(resolve, options.retryDelayMs ?? RETRY_DELAY_MS));
    result = await attempt(url, body, fetchImpl);
  }

  if (!result.sent) {
    console.error(
      `[booking-email] FAILED (${result.reason}) for booking ${booking.submission_key}.`,
    );
    return { sent: false, reason: result.reason };
  }
  return { sent: true };
}
