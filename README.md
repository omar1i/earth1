# Earth Adventure website

Bilingual (English / Arabic, RTL) adventure-tourism site. Stack: TanStack Start (React 19, SSR),
TypeScript, Tailwind v4. Trips, prices, images, departures and bookings live in a Cloudflare D1 database managed from `/admin`;
booking notifications are e-mailed through Resend. See `DEPLOY.txt` to set it up.

## Run it

```bash
npm install --legacy-peer-deps   # plain `npm install` fails on a peer-dependency conflict
npm run dev                      # local site
npm test                         # automated tests
npm run build                    # production build (targets Cloudflare Workers by default)
```

Put local values in `.env.local` (git-ignored; copy the names from `.env.example`). On a host, set
them in the host's environment-variable settings. Never commit secrets.

| Variable | Needed | What for |
|---|---|---|
| `RESEND_API_KEY` | **Yes** | Resend API key (secret) used to e-mail each booking |
| `BOOKING_NOTIFY_TO` | **Yes** | Your e-mail address(es) that receive each booking (comma-separated) |
| `BOOKING_FROM_EMAIL` | No | Sender, e.g. `Earth Adventure <bookings@yourdomain.com>` (needs a domain verified in Resend). Default: `onboarding@resend.dev` (test sender) |
| `BANK_DETAILS` | No | If set, customers who gave an e-mail get the bank transfer details automatically. Use ` | ` where a new line should start |
| `ADMIN_SETUP_TOKEN` | **Yes (once)** | Lets you create the first administrator at `/admin` |
| D1 binding `DB` | **Yes** | Configured in `wrangler.jsonc` (database `earth-adventure`) |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | No | No longer used by bookings (D1 replaced the optional Supabase backup) |
| `VITE_SUPABASE_*` | No | Only used by the optional Supabase client |

## How a booking works

1. The visitor fills in `/book` and accepts the Terms & Conditions.
2. The server validates it, saves it in D1 (seat capacity is enforced by the database, so a departure can
   never be overbooked; a retry reuses the same reference and cannot create a duplicate), then sends the
   Resend e-mail. If the e-mail fails the booking is still saved and flagged in the dashboard,
   where you can press "Resend e-mail".
3. If no D1 database is connected, the site falls back to the old e-mail-only behaviour.

Setup steps for the script: `integrations/google-apps-script/SETUP.md`.

## Add, change or remove a trip

Use the admin dashboard at `/admin` (Trips). `src/lib/content.ts` now only holds the fixed texts
(categories, FAQs, ...) and the original trips, which are used as a fallback until D1 is connected and as
the source of `migrations/0002_seed_existing_content.sql`. Do not edit trips in `content.ts` any more.

## Before you publish: checklist

- [ ] **Sample trips:** "Masirah Island" and the three `intl-sample-*` trips are placeholders
      (marked `SAMPLE` in `content.ts`). Replace them with real trips or delete them.
- [ ] **Legal:** have Terms & Conditions and Privacy Policy reviewed. They intentionally no longer
      show "draft" notes. No cancellation/refund policy is defined yet; add yours.
- [ ] **Resend:** `RESEND_API_KEY` and `BOOKING_NOTIFY_TO` set, `BOOKING_FROM_EMAIL` set (verified domain), `BANK_DETAILS` set if you want the automatic
      customer email. Send one test booking in English and one in Arabic.
- [ ] **"Within minutes" promise:** the site tells customers bank details arrive within minutes. That
      is only automatic when the customer typed an email and `BANK_DETAILS` is set; otherwise your
      notification email says "ACTION NEEDED" and you send the details yourself.
- [ ] Look at every page in Arabic on a phone and a desktop (right-to-left layout).

## Making changes with an AI coding agent

Work on a branch, run `npm test` and `npm run build`, look at the preview, then merge. Never paste
secrets into the chat. Example requests: "Add a trip called X in the Oman section with this Arabic
and English description, contact-for-price, using the photo I placed in src/assets" or "Change the
price of trip Y". Do not let the agent change `booking-schema.ts` and `content.ts` out of sync.

The original Lovable brief is kept in `docs/original-lovable-brief.md`.


