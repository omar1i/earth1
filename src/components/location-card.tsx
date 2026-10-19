import { useState } from 'react';
import { MapPin, Navigation, ArrowUpRight, MessageCircle } from 'lucide-react';
import { business, whatsapp } from '@/lib/content';
import { useLanguage } from '@/lib/language';

/** Company location: embedded map next to the address and "Get directions" / "Open in Google Maps" buttons. */
export function LocationCard({ compact = false }: { compact?: boolean }) {
  const { lang, t } = useLanguage();
  const [show, setShow] = useState(false);
  const lines = business.addressLines.map((l) => l[lang]).filter(Boolean);
  return (
    <section className={`loc-card${compact ? ' compact' : ''}`} aria-labelledby="loc-title">
      <div className="loc-info">
        <span className="loc-eyebrow"><MapPin size={16} aria-hidden="true" />{t('Find us', 'موقعنا')}</span>
        <h2 id="loc-title">{t('Visit Earth Adventure', 'زوروا Earth Adventure')}</h2>
        <address className="loc-address">
          <strong>Earth Adventure</strong>
          {lines.map((l) => <span key={l}>{l}</span>)}
        </address>
        <div className="loc-actions">
          <a className="loc-btn primary" href={business.directionsUrl} target="_blank" rel="noreferrer"><Navigation size={17} aria-hidden="true" />{t('Get directions', 'الاتجاهات')}</a>
          <a className="loc-btn" href={business.mapsUrl} target="_blank" rel="noreferrer">{t('Open in Google Maps', 'افتح في خرائط جوجل')}<ArrowUpRight size={16} aria-hidden="true" /></a>
          {!compact && <a className="loc-btn" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} aria-hidden="true" />{t('Ask on WhatsApp', 'اسألنا على واتساب')}</a>}
        </div>
      </div>
      <div className="loc-map">
        {show ? (
          <iframe title={t('Earth Adventure location on Google Maps', 'موقع Earth Adventure على خرائط جوجل')} src={business.embedUrl} referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        ) : (
          <button type="button" className="loc-map-ph" onClick={() => setShow(true)} aria-label={t('Show the map', 'عرض الخريطة')}>
            <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
              <rect width="600" height="400" fill="#e8f1f8" />
              <path d="M-20 300 C 90 250, 160 330, 260 290 S 440 230, 620 280 L620 420 L-20 420Z" fill="#cfe3f1" />
              <path d="M-20 340 C 110 300, 200 370, 320 335 S 500 290, 620 330 L620 420 L-20 420Z" fill="#b9d6ea" />
              <g stroke="#fff" strokeWidth="10" strokeLinecap="round" fill="none">
                <path d="M40 120 C 160 90, 260 160, 380 120 S 520 70, 590 100" />
                <path d="M120 20 C 150 100, 110 170, 170 250" />
                <path d="M330 10 C 350 80, 300 150, 360 230" />
              </g>
              <g stroke="#dbe7f0" strokeWidth="2"><path d="M0 200H600M0 60H600M200 0V400M450 0V400" /></g>
            </svg>
            <span className="loc-pin"><MapPin size={34} fill="currentColor" aria-hidden="true" /></span>
            <span className="loc-map-cta">{t('Show map', 'عرض الخريطة')}</span>
          </button>
        )}
      </div>
    </section>
  );
}
