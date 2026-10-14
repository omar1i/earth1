import { z } from 'zod';
export function muscatToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Muscat',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
// Which trips exist (and which departure a group trip uses) is decided on the server from the database,
// so the schema only checks the shape of the request. See src/lib/bookings.server.ts.
export const bookingSchema=z.object({
 submission_key:z.string().uuid(),
 experience_id:z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
 // Group trips: the chosen departure. Optional when the trip has a single departure.
 schedule_id:z.number().int().positive().optional(),
 customer_name:z.string().trim().min(2).max(100),
 contact_number:z.string().trim().regex(/^\+[0-9 ()-]{7,24}$/),
 email:z.union([z.string().trim().email().max(255),z.literal('')]).optional(),
 preferred_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d=>!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d&&d>=muscatToday()),
 participant_count:z.number().int().min(1).max(200),
 preferred_language:z.enum(['en','ar']),
 special_requirements:z.string().trim().max(2000).optional(),
 additional_notes:z.string().trim().max(2000).optional(),
 terms_accepted:z.literal(true),
 // Honeypot: hidden from people, so any value means an automated submission.
 company_url:z.string().max(0).optional(),
});
export type BookingInput=z.infer<typeof bookingSchema>;
