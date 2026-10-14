/**
 * Earth Adventure - booking email relay (Google Apps Script web app).
 *
 * The website's server posts each booking here. This script:
 *   1. emails the booking to the Gmail account that owns the script (always), and
 *   2. OPTIONALLY emails the customer a "preliminarily confirmed" message with your bank
 *      transfer details, when the script property BANK_DETAILS is set and the customer gave
 *      an email address.
 *
 * SECURITY: nothing sensitive is stored in this file. Put these in
 * Project Settings > Script properties:
 *   WEBHOOK_SECRET  (required)  same value as the website's BOOKING_WEBHOOK_SECRET
 *   BANK_DETAILS    (optional)  your transfer details; write " | " where a new line should start, e.g.
 *                               Bank: ... | Account name: ... | IBAN: ...
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('WEBHOOK_SECRET');
    if (!secret) return respond_({ ok: false, error: 'not_configured' });

    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (typeof data.secret !== 'string' || data.secret !== secret) {
      return respond_({ ok: false, error: 'unauthorized' });
    }

    var reference = String(data.reference || '');
    if (!/^[0-9a-fA-F-]{36}$/.test(reference)) return respond_({ ok: false, error: 'bad_request' });

    // Serialise concurrent retries of the same booking, then de-duplicate by reference.
    lock.waitLock(10000);
    var cache = CacheService.getScriptCache();
    if (cache.get('sent:' + reference)) return respond_({ ok: true, duplicate: true });

    // Customer email first (best effort), so the owner's email can say what happened.
    var customer = sendCustomerEmail_(data, reference, props.getProperty('BANK_DETAILS'), cache);

    var message = buildOwnerMessage_(data, reference, customer);
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(), // the Gmail account that owns this script
      subject: message.subject,
      body: message.body,
      replyTo: message.replyTo,
      name: 'Earth Adventure Website'
    });

    cache.put('sent:' + reference, '1', 21600); // remember for 6 hours (maximum allowed)
    return respond_({ ok: true, customer_email: customer });
  } catch (err) {
    return respond_({ ok: false, error: 'server_error' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

// Returns 'sent' | 'skipped' | 'failed'. Never throws: a customer-email problem must not stop
// the owner's email from being sent.
function sendCustomerEmail_(d, reference, bankDetails, cache) {
  try {
    var email = clean_(d.email, 255);
    if (!bankDetails || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'skipped';
    if (cache.get('cust:' + reference)) return 'sent'; // already sent for this booking
    var arabic = d.preferred_language === 'ar';
    var bank = String(bankDetails).replace(/\s*\|\s*/g, '\n').trim();
    var name = clean_(d.customer_name, 100);
    var trip = clean_(d.experience_name, 120);
    var date = clean_(d.preferred_date, 20);
    var people = clean_(d.participant_count, 6);
    var subject, body;
    if (arabic) {
      subject = 'Earth Adventure - تم تأكيد حجزك مبدئيًا';
      body = ['مرحبًا ' + name + '،', '',
        'شكرًا لاختيارك Earth Adventure. تم تأكيد حجزك مبدئيًا.', '',
        'الرحلة: ' + trip, 'التاريخ المفضل: ' + date, 'عدد المشاركين: ' + people,
        'رقم الحجز: ' + reference, '',
        'بيانات التحويل البنكي:', bank, '',
        'لأي استفسار يمكنك الرد على هذه الرسالة.'].join('\n');
    } else {
      subject = 'Earth Adventure - your booking is preliminarily confirmed';
      body = ['Hello ' + name + ',', '',
        'Thank you for choosing Earth Adventure. Your booking is preliminarily confirmed.', '',
        'Experience: ' + trip, 'Preferred date: ' + date, 'Participants: ' + people,
        'Booking reference: ' + reference, '',
        'Bank transfer details:', bank, '',
        'If you have any questions, simply reply to this email.'].join('\n');
    }
    MailApp.sendEmail({ to: email, subject: subject, body: body, name: 'Earth Adventure' });
    cache.put('cust:' + reference, '1', 21600);
    return 'sent';
  } catch (err) {
    return 'failed';
  }
}

function buildOwnerMessage_(d, reference, customer) {
  var phone = clean_(d.contact_number, 40);
  var email = clean_(d.email, 255);
  var digits = phone.replace(/[^0-9]/g, '');
  var action = customer === 'sent'
    ? 'Bank transfer details were emailed to the customer automatically.'
    : 'ACTION NEEDED: send the bank transfer details to the customer now (WhatsApp link below).'
      + (customer === 'failed' ? ' (The automatic email to the customer failed.)' : '');
  var lines = [
    'NEW BOOKING - preliminarily confirmed',
    action,
    '',
    'Experience: ' + clean_(d.experience_name, 120) + ' (' + clean_(d.experience_id, 100) + ')',
    'Preferred date: ' + clean_(d.preferred_date, 20),
    'Participants: ' + clean_(d.participant_count, 6),
    '',
    'Name: ' + clean_(d.customer_name, 100),
    'Phone: ' + phone,
    digits ? 'WhatsApp: https://wa.me/' + digits : '',
    'Email: ' + (email || '(not provided)'),
    'Preferred language: ' + (d.preferred_language === 'ar' ? 'Arabic' : 'English'),
    '',
    'Special requirements: ' + (clean_(d.special_requirements, 2000, true) || '-'),
    'Additional notes: ' + (clean_(d.additional_notes, 2000, true) || '-'),
    '',
    'Terms & Conditions accepted: ' + (d.terms_accepted === true ? 'yes' : 'NO'),
    'Submitted (UTC): ' + clean_(d.submitted_at, 40),
    'Reference: ' + reference
  ];
  return {
    subject: 'New booking: ' + clean_(d.experience_name, 80) + ' - ' + clean_(d.preferred_date, 20) +
             ' - ' + clean_(d.customer_name, 60),
    body: lines.join('\n'),
    // Replying in Gmail goes straight to the customer when they gave an email address.
    replyTo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ''
  };
}

// Coerce to text, cap the length, and (unless multiline is allowed) remove line breaks so a
// customer cannot inject extra email headers through the subject line.
function clean_(value, max, multiline) {
  var s = value === undefined || value === null ? '' : String(value);
  s = multiline ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                : s.replace(/[\u0000-\u001F\u007F]+/g, ' ');
  return s.trim().slice(0, max);
}

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
