// Branded HTML e-mails for new bookings. Built with tables and inline styles (the only thing that
// renders reliably in Gmail, Outlook and Apple Mail). Every piece of customer-supplied text goes
// through esc() before it is put in the markup.
import { whatsapp, instagram } from "./content";

export type EmailLang = "en" | "ar";
export const DEFAULT_SITE_URL = "https://earth1.omarabdelrahman201111.workers.dev";

const C = { blue: "#0070c0", primary: "#007adb", green: "#90c010", greenDark: "#4d7c0f", navy: "#0e2b44",
  bg: "#f2f6fa", border: "#e3eaf2", muted: "#5b6b7d", card: "#ffffff" };
const FONT = "'Segoe UI',Tahoma,Arial,'Helvetica Neue',sans-serif";

export const esc = (v: unknown): string =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const waDigits = /phone=(\d+)/.exec(whatsapp)?.[1] ?? "";
const phoneShown = waDigits ? `+${waDigits.slice(0, 3)} ${waDigits.slice(3, 7)} ${waDigits.slice(7)}` : "";
const igHandle = "@" + (instagram.split("/").filter(Boolean).pop() ?? "").split("?")[0];

export type EmailData = {
  ref: string; name: string; phone: string; email: string; date: string; people: string;
  language: EmailLang; trip: string; departure: string; requirements: string; notes: string;
  termsAccepted: boolean; submittedAt: string;
};
type Opts = { siteUrl?: string; logoUrl?: string };

function button(href: string, label: string, bg: string, color = "#ffffff", border = ""): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;margin:4px 5px;"><tr><td bgcolor="${bg}" style="border-radius:8px;${border ? `border:2px solid ${border};` : ""}"><a href="${esc(href)}" style="display:inline-block;padding:13px 22px;font-family:${FONT};font-size:15px;font-weight:700;color:${color};text-decoration:none;border-radius:8px;">${esc(label)}</a></td></tr></table>`;
}

function row(label: string, value: string, mono = false): string {
  if (!value) return "";
  return `<tr><td style="padding:9px 0;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:13px;color:${C.muted};width:38%;vertical-align:top;">${esc(label)}</td><td style="padding:9px 0;border-bottom:1px solid ${C.border};font-family:${mono ? "Consolas,Menlo,monospace" : FONT};font-size:${mono ? 12 : 15}px;font-weight:600;color:${C.navy};vertical-align:top;word-break:break-word;">${esc(value)}</td></tr>`;
}

function shell(o: { lang: EmailLang; title: string; preheader: string; body: string; footer: string }, opts: Opts): string {
  const rtl = o.lang === "ar"; const dir = rtl ? "rtl" : "ltr"; const start = rtl ? "right" : "left";
  const site = (opts.siteUrl ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const logo = opts.logoUrl ?? `${site}/email-logo.png`;
  return `<!doctype html><html lang="${o.lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};"><tr><td align="center" style="padding:26px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" dir="${dir}" style="width:100%;max-width:600px;background:${C.card};border:1px solid ${C.border};border-radius:14px;overflow:hidden;text-align:${start};">
<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="62%" height="5" style="height:5px;line-height:5px;font-size:0;background:${C.blue};">&nbsp;</td><td width="38%" height="5" style="height:5px;line-height:5px;font-size:0;background:${C.green};">&nbsp;</td></tr></table></td></tr>
<tr><td align="center" style="padding:26px 24px 6px;"><a href="${esc(site)}" style="text-decoration:none;"><img src="${esc(logo)}" width="200" alt="Earth Adventure" style="display:block;border:0;outline:none;width:200px;max-width:100%;height:auto;font-family:${FONT};font-size:22px;font-weight:800;color:${C.blue};"></a></td></tr>
${o.body}
<tr><td style="background:${C.navy};padding:22px 28px;text-align:center;font-family:${FONT};">
<div style="font-size:15px;font-weight:700;color:#ffffff;letter-spacing:.4px;">EARTH <span style="color:${C.green};">ADVENTURE</span></div>
<div style="padding-top:8px;font-size:13px;line-height:1.7;color:#c9d6e3;"><a href="${esc(whatsapp)}" style="color:#c9d6e3;text-decoration:none;" dir="ltr">${esc(phoneShown)}</a> &nbsp;·&nbsp; <a href="${esc(instagram)}" style="color:#c9d6e3;text-decoration:none;" dir="ltr">${esc(igHandle)}</a></div>
<div style="padding-top:10px;font-size:12px;line-height:1.6;color:#8fa3b8;">${o.footer}</div>
</td></tr></table></td></tr></table></body></html>`;
}

/** The confirmation the customer gets (only sent when bank details are configured). */
export function renderCustomerEmail(d: EmailData, bankDetails: string, opts: Opts = {}): string {
  const ar = d.language === "ar"; const start = ar ? "right" : "left";
  const T = ar
    ? { title: "تم تأكيد حجزك مبدئيًا", hello: `مرحبًا ${d.name}،`, intro: "شكرًا لاختيارك Earth Adventure. هذا ملخص حجزك:", trip: "المغامرة", dep: "الموعد", date: "التاريخ المفضل", people: "عدد المشاركين", ref: "رقم الحجز", bank: "بيانات التحويل البنكي", next: "سيتواصل معك فريقنا قريبًا بخصوص ترتيبات الرحلة. لأي استفسار يمكنك الرد على هذه الرسالة أو مراسلتنا عبر واتساب.", cta: "تواصل معنا عبر واتساب", wa: `مرحبًا Earth Adventure! رقم حجزي هو ${d.ref}.`, footer: "وصلتك هذه الرسالة لأنك أجريت حجزًا عبر موقعنا.", pre: `تم تأكيد حجزك لرحلة ${d.trip} مبدئيًا. بيانات التحويل البنكي بالداخل.` }
    : { title: "Your booking is preliminarily confirmed", hello: `Hello ${d.name},`, intro: "Thank you for choosing Earth Adventure. Here is a summary of your booking:", trip: "Experience", dep: "Departure", date: "Preferred date", people: "Participants", ref: "Booking reference", bank: "Bank transfer details", next: "Our team will contact you shortly about the trip arrangements. If you have any questions, simply reply to this email or message us on WhatsApp.", cta: "Chat with us on WhatsApp", wa: `Hello Earth Adventure! My booking reference is ${d.ref}.`, footer: "You are receiving this email because you made a booking on our website.", pre: `Your booking for ${d.trip} is preliminarily confirmed. Bank transfer details inside.` };
  const bankRows = bankDetails.split(/\s*\|\s*|\r?\n/).map((s) => s.trim()).filter(Boolean).map((line) => {
    const m = /^([^:：]{1,40})[:：]\s*(.+)$/.exec(line);
    return m
      ? `<tr><td style="padding:6px 0;font-family:${FONT};font-size:13px;color:${C.muted};width:38%;vertical-align:top;">${esc(m[1])}</td><td dir="ltr" style="padding:6px 0;font-family:${FONT};font-size:15px;font-weight:700;color:${C.navy};text-align:${start};word-break:break-word;">${esc(m[2])}</td></tr>`
      : `<tr><td colspan="2" style="padding:6px 0;font-family:${FONT};font-size:15px;font-weight:600;color:${C.navy};">${esc(line)}</td></tr>`;
  }).join("");
  const waLink = `${whatsapp}&text=${encodeURIComponent(T.wa)}`;
  const body = `<tr><td align="center" style="padding:14px 28px 4px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="54" height="54" bgcolor="${C.green}" style="width:54px;height:54px;border-radius:27px;font-family:${FONT};font-size:28px;line-height:54px;font-weight:800;color:#ffffff;text-align:center;">&#10003;</td></tr></table></td></tr>
<tr><td align="center" style="padding:14px 28px 4px;font-family:${FONT};font-size:25px;line-height:1.3;font-weight:800;color:${C.navy};">${esc(T.title)}</td></tr>
<tr><td style="padding:14px 32px 6px;font-family:${FONT};font-size:15px;line-height:1.7;color:${C.navy};"><strong>${esc(T.hello)}</strong><br>${esc(T.intro)}</td></tr>
<tr><td style="padding:8px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};border-radius:10px;"><tr><td style="padding:6px 18px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:${start};">${row(T.trip, d.trip)}${row(T.dep, d.departure)}${row(T.date, d.date)}${row(T.people, d.people)}${row(T.ref, d.ref, true)}</table></td></tr></table></td></tr>
<tr><td style="padding:16px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-${ar ? "right" : "left"}:5px solid ${C.green};border-radius:10px;"><tr><td style="padding:14px 18px;"><div style="font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:${C.greenDark};padding-bottom:6px;">${esc(T.bank)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:${start};">${bankRows}</table></td></tr></table></td></tr>
<tr><td style="padding:16px 32px 4px;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.muted};">${esc(T.next)}</td></tr>
<tr><td align="center" style="padding:14px 28px 28px;">${button(waLink, T.cta, "#1fa855")}</td></tr>`;
  return shell({ lang: d.language, title: T.title, preheader: T.pre, body, footer: esc(T.footer) }, opts);
}

/** The new-booking alert the business owner gets (always English). */
export function renderOwnerEmail(d: EmailData, customer: "sent" | "skipped" | "failed", opts: Opts = {}): string {
  const site = (opts.siteUrl ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const digits = d.phone.replace(/[^0-9]/g, "");
  const callout = customer === "sent"
    ? { bg: "#eef7dc", bd: C.green, fg: "#3f6212", text: "Bank transfer details were emailed to the customer automatically." }
    : { bg: "#fff4d6", bd: "#f0b429", fg: "#92400e", text: `Action needed: send the bank transfer details to the customer now.${customer === "failed" ? " (The automatic email to the customer failed.)" : ""}` };
  const note = (label: string, v: string) => v ? `<tr><td style="padding:6px 0 2px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:${C.muted};">${esc(label)}</td></tr><tr><td style="padding:0 0 10px;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.navy};white-space:pre-wrap;word-break:break-word;">${esc(v)}</td></tr>` : "";
  const buttons = [
    digits ? button(`${whatsapp.split("?")[0]}?phone=${digits}`, "WhatsApp customer", "#1fa855") : "",
    d.phone ? button(`tel:${d.phone.replace(/[^0-9+]/g, "")}`, "Call", C.primary) : "",
    d.email ? button(`mailto:${d.email}`, "Reply by email", "#ffffff", C.primary, C.primary) : "",
  ].join("");
  const body = `<tr><td align="center" style="padding:10px 28px 0;"><span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${C.green};font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:.8px;color:#ffffff;">NEW BOOKING</span></td></tr>
<tr><td align="center" style="padding:12px 28px 2px;font-family:${FONT};font-size:25px;line-height:1.3;font-weight:800;color:${C.navy};">${esc(d.trip)}</td></tr>
<tr><td align="center" style="padding:0 28px 14px;font-family:${FONT};font-size:15px;color:${C.muted};">${esc(d.date)} &nbsp;·&nbsp; ${esc(d.people)} participant${d.people === "1" ? "" : "s"}</td></tr>
<tr><td style="padding:0 32px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${callout.bg};border:1px solid ${callout.bd};border-radius:10px;"><tr><td style="padding:12px 16px;font-family:${FONT};font-size:14px;line-height:1.6;font-weight:600;color:${callout.fg};">${esc(callout.text)}</td></tr></table></td></tr>
<tr><td style="padding:8px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};border-radius:10px;"><tr><td style="padding:6px 18px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Name", d.name)}${row("Phone", d.phone)}${row("Email", d.email || "(not provided)")}${row("Language", d.language === "ar" ? "Arabic" : "English")}${row("Departure", d.departure)}${row("Preferred date", d.date)}${row("Participants", d.people)}</table></td></tr></table></td></tr>
${d.requirements || d.notes ? `<tr><td style="padding:12px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${note("Special requirements", d.requirements)}${note("Additional notes", d.notes)}</table></td></tr>` : ""}
<tr><td align="center" style="padding:14px 28px 6px;">${buttons}</td></tr>
<tr><td align="center" style="padding:2px 28px 6px;font-family:${FONT};font-size:14px;"><a href="${esc(site)}/admin" style="color:${C.primary};font-weight:700;text-decoration:none;">Open the dashboard &rarr;</a></td></tr>
<tr><td align="center" style="padding:10px 28px 24px;font-family:Consolas,Menlo,monospace;font-size:11px;line-height:1.7;color:${C.muted};">Ref ${esc(d.ref)}<br>Submitted ${esc(d.submittedAt)} UTC &nbsp;·&nbsp; Terms accepted: ${d.termsAccepted ? "yes" : "NO"}</td></tr>`;
  return shell({ lang: "en", title: `New booking: ${d.trip}`, preheader: `${d.name} booked ${d.trip} for ${d.date} (${d.people}).`, body, footer: "Automatic notification from your website booking form." }, opts);
}
