import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { bookingSchema, type BookingInput } from "./booking-schema";
import type { Database } from "@/integrations/supabase/types";

// Delivery model: the email to the owner is what makes a booking "received". A Supabase copy is an
// OPTIONAL backup (used only when SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set). The customer
// sees success only when the email was delivered; otherwise they see the error message with the
// WhatsApp option. A retry reuses the same reference, so it cannot create a duplicate record.

type BackupResult = "saved" | "skipped" | "failed" | "invalid_session";

async function sendOwnerEmail(booking: BookingInput): Promise<boolean> {
  try {
    const { notifyBooking } = await import("./booking-notify.server");
    return (await notifyBooking(booking)).sent;
  } catch {
    console.error(`[booking-email] FAILED (unexpected) for booking ${booking.submission_key}.`);
    return false;
  }
}

async function saveBackup(data: BookingInput): Promise<BackupResult> {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) return "skipped";
  try {
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
            headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
    const auth = getRequestHeader("authorization");
    if (auth) {
      const token = auth.replace(/^Bearer\s+/i, "");
      const { error } = await client.auth.getUser(token);
      if (error) return "invalid_session";
    }
    // Guest inquiries without account ownership. RLS allows insert only, never reads.
    // Consent/honeypot fields are not columns of the table.
    const { terms_accepted: _terms, company_url: _honeypot, ...record } = data;
    void _terms;
    void _honeypot;
    const { error } = await client.from("booking_requests").insert({
      ...record,
      id: data.submission_key,
      email: data.email || null,
      special_requirements: data.special_requirements || null,
      additional_notes: data.additional_notes || null,
    });
    if (error) {
      if (error.code === "23505") return "saved"; // already stored by an earlier attempt
      console.error("Booking backup insert failed", error.code);
      return "failed";
    }
    return "saved";
  } catch {
    console.error("Booking backup insert failed (unexpected)");
    return "failed";
  }
}

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingSchema.parse(input))
  .handler(async ({ data }) => {
    const backup = await saveBackup(data);
    if (backup === "invalid_session") return { ok: false as const, error: "invalid_session" };
    const emailed = await sendOwnerEmail(data);
    if (!emailed) {
      console.error(
        `[booking] Booking ${data.submission_key} was NOT delivered by email (database backup: ${backup}).`,
      );
      return { ok: false as const, error: backup === "saved" ? "save_failed" : "unavailable" };
    }
    if (backup === "failed") {
      console.error(
        `[booking] Booking ${data.submission_key} emailed, but the database backup failed.`,
      );
    }
    return { ok: true as const, reference: data.submission_key };
  });
