import { createServerFn } from "@tanstack/react-start";
import { bookingSchema } from "./booking-schema";
import type { BookingResult } from "./bookings.server";

// Booking flow: validate on the server, store the booking in Cloudflare D1 (seat capacity is enforced
// by the database), then send the owner e-mail through the existing Apps Script webhook.
// A retry reuses the same reference, so it can never create a duplicate record.
export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingSchema.parse(input))
  .handler(async ({ data }): Promise<BookingResult> => {
    const { processBooking } = await import("./bookings.server");
    return processBooking(data);
  });
