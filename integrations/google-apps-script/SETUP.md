# Booking email setup (Google Apps Script)

How a booking is handled:

1. The customer submits the form. The website's server sends the booking to your Apps Script.
2. The script emails the booking to your Gmail. **This email is what counts as "received":** the
   customer only sees the success screen if it was delivered; otherwise they see an error with the
   WhatsApp option and can retry safely (same reference, no duplicates).
3. Optional: if you set `BANK_DETAILS` (below), the script also emails the customer a
   "preliminarily confirmed" message with your bank transfer details (only when the customer
   typed an email address). Otherwise your email says "ACTION NEEDED: send the bank transfer
   details" with a WhatsApp link, and you send them yourself.
4. Optional: a Supabase copy of each booking is stored only if `SUPABASE_URL` and
   `SUPABASE_PUBLISHABLE_KEY` are set on the server. Without them the site works with email only.

## Steps

1. Sign in to the Gmail account that should receive bookings and open https://script.google.com.
2. New project: replace the default code with `booking-webhook.gs` from this folder. Save.
3. Project Settings (gear icon) > Script properties > Add:
   - `WEBHOOK_SECRET` = a long random value (e.g. the output of `openssl rand -hex 32`). Required.
   - `BANK_DETAILS` = your transfer details, optional. Write ` | ` where a new line should start,
     for example `Bank: ... | Account name: ... | IBAN: ...`.
4. Deploy > New deployment > type **Web app**. Execute as: **Me**. Who has access: **Anyone**.
   Deploy, authorise the Gmail-send permission when asked, and copy the **Web app URL**
   (it ends in `/exec`).
5. Set these two server-side environment variables on the host (or in `.env.local` for local work):
   `BOOKING_WEBHOOK_URL` = the Web app URL, `BOOKING_WEBHOOK_SECRET` = the same value as step 3.
6. Never commit either value or your bank details. `.env.local` is git-ignored;
   `.env.example` lists the names only.

After editing the script later, use Deploy > Manage deployments > Edit > New version, or the
live `/exec` URL keeps running the old code.

Gmail limits Apps Script to roughly 100 emails per day for a normal Gmail account. With
`BANK_DETAILS` set, each booking can use two emails (one to you, one to the customer).
