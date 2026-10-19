import { MapPin, Navigation, ArrowUpRight, MessageCircle } from 'lucide-react';
import { business, whatsapp } from '@/lib/content';
import { useLanguage } from '@/lib/language';

/** Company location: embedded map next to the address and "Get directions" / "Open in Google Maps" buttons. */
export function LocationCard({ compact = false }: { compact?: boolean }) {
  const { lang, t } = useLanguage();
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
        <iframe title={t('Earth Adventure location on Google Maps', 'موقع Earth Adventure على خرائط جوجل')} src={business.embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>
    </section>
  );
}
