// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderCustomerEmail, renderOwnerEmail, type EmailData } from "@/lib/booking-email-template";

const data: EmailData = {
  ref: "55c1ad41-1b0e-4b1c-a513-7246ad52f3fb", name: "Test Visitor", phone: "+96800000000", email: "visitor@example.com",
  date: "2030-01-01", people: "2", language: "en", trip: "Sea Fishing Adventure", departure: "20-21 November 2026",
  requirements: "Vegetarian", notes: "Hello", termsAccepted: true, submittedAt: "2026-10-15 10:00",
};
const PAYMENT_WORDS = [/bank/i, /iban/i, /account/i, /transfer/i, /payment/i, /deposit/i, /OM00TEST/, /التحويل/, /البنك/, /الآيبان/, /الدفع/, /العربون/];

describe("customer e-mail", () => {
  it("shows the booking, the brand and a WhatsApp button", () => {
    const html = renderCustomerEmail(data);
    for (const s of ["Your booking is preliminarily confirmed", "Test Visitor", "Sea Fishing Adventure", "20-21 November 2026", "#0070c0", "#90c010", "/email-logo.png", data.ref]) {
      expect(html).toContain(s);
    }
    expect(html).toContain("https://api.whatsapp.com/send?phone=96891915594&amp;text=");
    expect(html).toContain('dir="ltr"');
    expect(html).not.toContain(" | ");
  });
  it("is right-to-left and in Arabic for Arabic customers", () => {
    const html = renderCustomerEmail({ ...data, language: "ar" });
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain("تم تأكيد حجزك مبدئيًا");
  });
  it("contains no payment or bank details at all, in English or Arabic", () => {
    for (const language of ["en", "ar"] as const) {
      const html = renderCustomerEmail({ ...data, language });
      const visibleText = html.replace(/<[^>]*>/g, " ");
      for (const word of PAYMENT_WORDS) expect(visibleText).not.toMatch(word);
    }
  });
  it("escapes anything the customer typed", () => {
    const evil = renderCustomerEmail({ ...data, name: '<img src=x onerror=alert(1)>', trip: '"><script>x</script>' });
    expect(evil).not.toContain("<img src=x");
    expect(evil).not.toContain("<script>");
    expect(evil).toContain("&lt;img src=x");
  });
  it("uses the logo from a custom site address", () => {
    expect(renderCustomerEmail(data, { siteUrl: "https://example.com/" })).toContain('src="https://example.com/email-logo.png"');
  });
});

describe("owner e-mail", () => {
  it("shows an amber action box when the customer was not e-mailed", () => {
    const html = renderOwnerEmail(data, "skipped");
    expect(html).toContain("Action needed");
    expect(html).toContain("NEW BOOKING");
    expect(html).toContain("mailto:visitor@example.com");
    expect(html).toContain("tel:+96800000000");
    expect(html).toContain("https://api.whatsapp.com/send?phone=96800000000");
    expect(html).toContain("/admin");
  });
  it("shows the green box when the customer confirmation was sent", () => {
    const html = renderOwnerEmail(data, "sent");
    expect(html).toContain("confirmation email was sent to the customer automatically");
    expect(html).not.toContain("Action needed");
  });
  it("asks the owner to contact the customer when the confirmation email failed", () => {
    const html = renderOwnerEmail(data, "failed");
    expect(html).toContain("Action needed");
    expect(html).toContain("failed");
  });
  it("has no mailto button without a customer e-mail and escapes notes", () => {
    const html = renderOwnerEmail({ ...data, email: "", notes: "<b>hi</b>" }, "skipped");
    expect(html).not.toContain("mailto:");
    expect(html).toContain("&lt;b&gt;hi&lt;/b&gt;");
  });
});
