import { Link } from '@tanstack/react-router';
import { ArrowRight, ArrowUpRight, CalendarDays, Clock, MapPin, MessageCircle, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language';
import { privateTripsIntro, privateTripWhatsapp, whatsapp, type GroupTrip, type PrivateDestination } from '@/lib/content';
import { useCatalog } from '@/lib/catalog-context';
import { seatStatus } from '@/lib/catalog';

// Private Trips: inspiration cards only. One "Contact Us" button per card opens WhatsApp.
export function PrivateTripsSection({ destinations }: { destinations?: PrivateDestination[] } = {}) {
  const { lang, t } = useLanguage();
  const catalog = useCatalog();
  const privateDestinations = destinations ?? catalog.privateDestinations;
  return (
    <section className="trip-part" aria-labelledby="private-trips-title">
      <div className="trip-part-head trip-part-head-main">
        <h3 id="private-trips-title">{privateTripsIntro.title[lang]}</h3>
        <p>{privateTripsIntro.text[lang]}</p>
      </div>
      <div className="trip-grid-4">
        {privateDestinations.map((d) => (
          <article className="experience-card" key={d.id}>
            <div className="experience-image">
              <img src={d.image} alt={d.name[lang]} loading="lazy" width="600" height="400" />
            </div>
            <div className="experience-body">
              <h3>{d.name[lang]}</h3>
              <p>{d.description[lang]}</p>
              <div className="experience-actions">
                <Button asChild size="sm" className="contact-btn">
                  <a href={privateTripWhatsapp(d.name.en)} target="_blank" rel="noreferrer">
                    <MessageCircle size={15} />
                    {t('Contact Us', 'تواصل معنا')}
                  </a>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GroupTripCard({ trip }: { trip: GroupTrip }) {
  const { lang, t } = useLanguage();
  const seats = seatStatus(trip.schedules);
  const seatText = !seats
    ? ''
    : seats.tone === 'full'
      ? t('Fully booked', 'مكتملة')
      : seats.tone === 'closed'
        ? t('Booking closed', 'الحجز مغلق')
        : lang === 'ar'
          ? seats.left === 1 ? 'بقي مقعد واحد' : seats.left === 2 ? 'بقي مقعدان' : seats.left <= 10 ? `بقي ${seats.left} مقاعد` : `بقي ${seats.left} مقعدًا`
          : `${seats.left} ${seats.left === 1 ? 'seat' : 'seats'} left`;
  return (
    <article className="experience-card">
      <Link className="experience-image" to="/group-trips/$trip" params={{ trip: trip.id }}>
        <img src={trip.image} alt={trip.name[lang]} loading="lazy" width="600" height="400" />
        <span className="experience-tag">{t('Group Trip', 'رحلة جماعية')}</span>
        {seats && <span className={`trip-seats trip-seats-${seats.tone}`}>{seatText}</span>}
        <div className="trip-overlay">
          <span className="trip-overlay-date"><CalendarDays aria-hidden="true" />{trip.date[lang]}</span>
          <span className="trip-overlay-price"><Tag aria-hidden="true" />{trip.price[lang]}</span>
        </div>
      </Link>
      <div className="experience-body">
        <h3>
          <Link to="/group-trips/$trip" params={{ trip: trip.id }}>{trip.name[lang]}</Link>
        </h3>
        <p>{trip.description[lang]}</p>
        <div className="experience-meta">
          <span><MapPin />{trip.location[lang]}</span>
          <span><Clock />{trip.duration[lang]}</span>
        </div>
        <div className="experience-actions">
          <Link className="text-link" to="/group-trips/$trip" params={{ trip: trip.id }}>
            {t('View Details', 'عرض التفاصيل')}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </article>
  );
}

// Group Trips: scheduled trips guests can join; every trip has its own detail page.
export function GroupTripsSection({ trips }: { trips?: GroupTrip[] } = {}) {
  const { t } = useLanguage();
  const catalog = useCatalog();
  const groupTrips = trips ?? catalog.groupTrips;
  return (
    <section className="trip-part trip-part-group" aria-labelledby="group-trips-title">
      <div className="trip-part-head trip-part-head-main">
        <h3 id="group-trips-title">{t('Group Trips', 'الرحلات الجماعية')}</h3>
        <p>{t('Trips we announce on set dates. Pick one, read the full details and join the group.', 'رحلات نعلن عنها في مواعيد محددة. اختر رحلة واطلع على كل التفاصيل وانضم إلى المجموعة.')}</p>
      </div>
      <div className="experience-grid">
        {groupTrips.map((trip) => (
          <GroupTripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </section>
  );
}

export function ContactTripLink({ message, label }: { message: string; label: string }) {
  return (
    <Button asChild size="lg">
      <a href={`${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
        <MessageCircle size={17} />
        {label}
        <ArrowUpRight size={17} />
      </a>
    </Button>
  );
}
