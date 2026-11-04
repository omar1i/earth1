-- Pricing box on group trip pages (shown before "What's included").
-- Each item is a bilingual line, e.g. {"en":"Double room: OMR 690 per person","ar":"..."}.
ALTER TABLE trips ADD COLUMN pricing TEXT NOT NULL DEFAULT '[]';

UPDATE trips SET pricing = '[{"en":"Double room: OMR 690 per person","ar":"\u0627\u0644\u063a\u0631\u0641\u0629 \u0627\u0644\u0645\u0632\u062f\u0648\u062c\u0629: 690 \u0631.\u0639. \u0644\u0644\u0634\u062e\u0635"},{"en":"Single room: OMR 860 per person","ar":"\u0627\u0644\u063a\u0631\u0641\u0629 \u0627\u0644\u0641\u0631\u062f\u064a\u0629: 860 \u0631.\u0639. \u0644\u0644\u0634\u062e\u0635"}]'
WHERE slug = 'kyrgyzstan-women-trip';
