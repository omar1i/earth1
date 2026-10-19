import { useState } from 'react';
import { MapPin, Navigation, ArrowUpRight, MessageCircle } from 'lucide-react';
import { business, whatsapp } from '@/lib/content';
import { useLanguage } from '@/lib/language';


// Where the red pin sits on the drawing (viewBox units). Move it here if you want it a little higher/lower or left/right.
const PIN = { x: 268, y: 126 };

/** A hand-drawn, not-to-scale illustration of Masirah Island with the company pin. */
function IslandMap({ t }: { t: (en: string, ar: string) => string }) {
  return (
    <svg className="loc-svg" viewBox="0 0 400 540" preserveAspectRatio="xMidYMid meet" role="img" aria-label={t('Illustrated map of Masirah Island with the Earth Adventure location', 'خريطة توضيحية لجزيرة مصيرة مع موقع Earth Adventure')}>
      <g stroke="#9cc4d8" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".9">
        <path d="M318 200q8-5 16 0t16 0t16 0" />
        <path d="M330 222q8-5 16 0t16 0" />
        <path d="M300 300q8-5 16 0t16 0t16 0" />
        <path d="M284 392q8-5 16 0t16 0" />
        <path d="M120 150q8-5 16 0t16 0" />
        <path d="M110 330q8-5 16 0t16 0t16 0" />
        <path d="M130 440q8-5 16 0t16 0" />
      </g>
      <path d="M215 28C245 22 280 40 290 78C298 110 300 140 292 172C284 205 300 232 282 268C266 300 256 330 238 365C224 392 218 425 205 455C198 475 192 492 184 500C176 492 170 470 172 445C176 410 160 380 168 345C176 310 160 280 172 245C182 215 168 190 176 160C184 130 170 100 180 72C186 50 196 34 215 28Z" fill="#f2e9d3" stroke="#1f6f8b" strokeWidth="3" strokeLinejoin="round" />
      <path d="M233 70C238 150 218 232 207 330S196 450 189 488" fill="none" stroke="#d3c39a" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
      <g textAnchor="middle" fill="#1f6f8b" fontWeight="800">
        <text x="226" y="300" fontSize="19" letterSpacing="2" transform="rotate(-8 226 300)">{t('MASIRAH ISLAND', 'جزيرة مصيرة')}</text>
      </g>
      <text x="350" y="410" textAnchor="middle" fontSize="13" fontStyle="italic" fill="#5b8fa6">{t('Arabian Sea', 'بحر العرب')}</text>
      <g transform="translate(36 46)" fill="#1f6f8b" textAnchor="middle" fontWeight="700">
        <path d="M0 -16L7 4L0 0L-7 4Z" />
        <text y="22" fontSize="12">N</text>
      </g>
      <g transform={`translate(${PIN.x} ${PIN.y})`}>
        <ellipse className="loc-pulse" cx="0" cy="0" rx="14" ry="6" fill="#e53935" />
        <path d="M0 0C-4-8-16-20-16-32A16 16 0 1 1 16-32C16-20 4-8 0 0Z" fill="#e53935" stroke="#fff" strokeWidth="2.5" />
        <circle cx="0" cy="-32" r="6" fill="#fff" />
      </g>
      <g transform={`translate(${PIN.x} ${PIN.y - 68})`}>
        <rect x="-66" y="-15" width="132" height="30" rx="15" fill="#fff" stroke="#e53935" strokeWidth="2" />
        <text y="5" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0b2a3a">Earth Adventure</text>
      </g>
    </svg>
  );
}

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
          <>
            <iframe title={t('Earth Adventure location on Google Maps', 'موقع Earth Adventure على خرائط جوجل')} src={business.embedUrl} referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            <button type="button" className="loc-map-back" onClick={() => setShow(false)}>{t('Back to illustration', 'العودة للرسمة')}</button>
          </>
        ) : (
          <>
            <IslandMap t={t} />
            <span className="loc-note">{t('Illustration, not to scale', 'رسم توضيحي غير مقياس')}</span>
            <button type="button" className="loc-map-cta" onClick={() => setShow(true)}>
              <MapPin size={16} aria-hidden="true" />{t('Open Google Map', 'افتح خريطة جوجل')}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
