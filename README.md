# Earth Adventure website

Bilingual (English / Arabic, RTL) adventure-tourism site. Stack: TanStack Start (React 19, SSR),
TypeScript, Tailwind v4. Bookings are delivered by email through a Google Apps Script.

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
| `BOOKING_WEBHOOK_URL` | **Yes** | Apps Script web-app URL that emails each booking to you |
| `BOOKING_WEBHOOK_SECRET` | **Yes** | Shared secret, same value as the script's `WEBHOOK_SECRET` |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | No | Optional database backup copy of each booking |
| `VITE_SUPABASE_*` | No | Only used by the optional Supabase client |

## How a booking works

1. The visitor fills in `/book` and accepts the Terms & Conditions.
2. The server sends it to your Apps Script, which emails you (and, if you set `BANK_DETAILS`,
   emails the customer the bank-transfer details). **The customer sees the success screen only if
   that email was delivered**; otherwise they see an error with the WhatsApp option and can retry
   safely (same reference, no duplicates).
3. If Supabase is configured, a backup copy is stored too.

Setup steps for the script: `integrations/google-apps-script/SETUP.md`.

## Add, change or remove a trip

Trips live in `src/lib/content.ts` (`experiences`). Each trip needs:
`id`, `category`, `region` (`'oman'` or `'international'`), bilingual `name` and `description`,
`price` (`null` = "Contact for Price") and `priceType`; `image` is optional.

1. Add the object to `experiences` (copy an existing one).
2. Add its `id` to `experienceIds` in `src/lib/booking-schema.ts`. `npm test` fails if the two lists
   drift apart, so a trip can never appear in the form but be un-bookable.
3. Photo: put the file in `src/assets/`, import it at the top of `content.ts`, set `image`. A trip
   without `image` shows a neutral placeholder.
4. Remove a trip by deleting its object (and its id from `experienceIds`).

## Before you publish: checklist

- [ ] **Sample trips:** "Masirah Island" and the three `intl-sample-*` trips are placeholders
      (marked `SAMPLE` in `content.ts`). Replace them with real trips or delete them.
- [ ] **Legal:** have Terms & Conditions and Privacy Policy reviewed. They intentionally no longer
      show "draft" notes. No cancellation/refund policy is defined yet; add yours.
- [ ] **Apps Script:** created, deployed, secret set, `BANK_DETAILS` set if you want the automatic
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


