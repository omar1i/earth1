import type { CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { type LucideIcon, ArrowRight, ArrowUpRight, CalendarDays, Clock, Heart, MapPin, MessageCircle, Sparkles, Tag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, type Bilingual } from '@/lib/language';
import { isMasirahTrip, groupTripsIntro, privateTripsIntro, privateTripWhatsapp, tripRegion, whatsapp, type GroupTrip, type PrivateDestination } from '@/lib/content';
import { useCatalog } from '@/lib/catalog-context';
import { seatStatus, privateHasPage } from '@/lib/catalog';
import { ImageSlider } from '@/components/image-slider';

// "Sample price: OMR 450 per group" is long for a small card, so the card shows the plain price and a "Sample" label instead.
const plainPrice = (text: string) => text.replace(/^(Sample price:|سعر تجريبي:)\s*/i, '');

// One private-trip card. Same look as the group-trip cards: white label, price over the photo, facts row, then the actions.
export function PrivateTripCard({ d }: { d: PrivateDestination }) {
  const { lang, t } = useLanguage();
  const page = privateHasPage(d);
  const media = (
    <>
      <img src={d.image} alt={d.name[lang]} loading="lazy" width="600" height="400" />
      <span className="experience-tag">{d.tag ? d.tag[lang] : t('Private Trip', 'رحلة خاصة')}</span>
      {d.sample && d.price && <span className="trip-seats trip-seats-closed">{t('Sample', 'تجريبي')}</span>}
      {d.price && (
        <div className="trip-overlay">
          <span className="trip-overlay-price"><Tag aria-hidden="true" />{plainPrice(d.price[lang])}</span>
        </div>
      )}
    </>
  );
  const hasFacts = !!(d.location || d.duration || d.maxGuests);
  return (
    <article className="experience-card private-card">
      {page ? (
        <Link className="experience-image" to="/private-trips/$trip" params={{ trip: d.id }}>{media}</Link>
      ) : (
        <div className="experience-image">{media}</div>
      )}
      <div className="experience-body">
        <h3>{page ? <Link to="/private-trips/$trip" params={{ trip: d.id }}>{d.name[lang]}</Link> : d.name[lang]}</h3>
        <p>{d.description[lang]}</p>
        {hasFacts && (
          <div className="experience-meta">
            {d.duration && <span><Clock />{d.duration[lang]}</span>}
            {d.maxGuests && <span><Users />{t(`Up to ${d.maxGuests} guests`, `حتى ${d.maxGuests} أشخاص`)}</span>}
          </div>
        )}
        <div className="experience-actions">
          {page && (
            <Link className="text-link" to="/private-trips/$trip" params={{ trip: d.id }}>
              {t('View Details', 'عرض التفاصيل')}
              <ArrowRight />
            </Link>
          )}
          {isMasirahTrip(d) ? (
            <Button asChild size="sm" className="contact-btn">
              <Link to="/book" search={{ experience: d.id }}>
                {t('Book Now', 'احجز الآن')}
                <ArrowUpRight size={15} />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="contact-btn">
              <a href={privateTripWhatsapp(d.name.en)} target="_blank" rel="noreferrer">
                <MessageCircle size={15} />
                {t('Contact Us', 'تواصل معنا')}
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

// Wraps one word of a sentence in <em> so it can be styled as the accent word.
function highlight(text: string, word: string) {
  const i = text.indexOf(word);
  if (i < 0) return text;
  return <>{text.slice(0, i)}<em>{word}</em>{text.slice(i + word.length)}</>;
}

type IntroContent = {
  lead: Bilingual; leadHighlight: Bilingual; text: Bilingual; steps: Bilingual[];
  after?: Bilingual; closing: Bilingual; closingHighlight: Bilingual;
};

// Shared editorial intro for the private and group trip sections.
function TripsIntro({ content, icons }: { content: IntroContent; icons: LucideIcon[] }) {
  const { lang } = useLanguage();
  return (
    <div className="pt-intro">
      <div className="pt-main">
        <div className="pt-copy">
          <p className="pt-lead">{highlight(content.lead[lang], content.leadHighlight[lang])}</p>
          <p className="pt-text">{content.text[lang]}</p>
        </div>
        <div className="pt-path">
          <ol className="pt-steps">
            {content.steps.map((step, i) => {
              const Icon = icons[i % icons.length];
              return (
                <li key={i} style={{ '--i': i } as CSSProperties}>
                  <span className="pt-node"><Icon aria-hidden="true" /></span>
                  <span className="pt-step-body">
                    <small>{`0${i + 1}`}</small>
                    <span className="pt-step-label">{step[lang]}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          {content.after && <p className="pt-after">{content.after[lang]}</p>}
        </div>
      </div>
      <p className="pt-closing">
        <Sparkles aria-hidden="true" />
        <span>{highlight(content.closing[lang], content.closingHighlight[lang])}</span>
      </p>
    </div>
  );
}

// Private Trips: ideas for trips designed around the guest. Cards with a trip page link to it; every card has "Contact Us" (WhatsApp).
export function PrivateTripsSection({ destinations }: { destinations?: PrivateDestination[] } = {}) {
  const { lang } = useLanguage();
  const catalog = useCatalog();
  const privateDestinations = destinations ?? catalog.privateDestinations;
  return (
    <section className="trip-part" aria-labelledby="private-trips-title">
      <div className="trip-part-head trip-part-head-main">
        <h3 id="private-trips-title">{privateTripsIntro.title[lang]}</h3>
      </div>
      <TripsIntro content={privateTripsIntro} icons={[MapPin, Heart, Sparkles]} />
      <div className="trip-grid-4">
        {privateDestinations.map((d) => <PrivateTripCard key={d.id} d={d} />)}
      </div>
    </section>
  );
}

export function GroupTripCard({ trip }: { trip: GroupTrip }) {
  const { lang, t } = useLanguage();
  const seats = seatStatus(trip.schedules);
  const photos = trip.gallery && trip.gallery.length > 0 ? trip.gallery : [trip.image];
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
      {photos.length > 1 ? (
        // Several photos: a swipeable slideshow. Each photo is still a link to the trip page.
        <div className="experience-image has-slider">
          <ImageSlider
            images={photos}
            alt={trip.name[lang]}
            renderSlide={(img, active) => (
              <Link className="slider-link" to="/group-trips/$trip" params={{ trip: trip.id }} tabIndex={active ? 0 : -1}>
                {img}
              </Link>
            )}
          />
          <span className="experience-tag">{t('Group Trip', 'رحلة جماعية')}</span>
          {seats && <span className={`trip-seats trip-seats-${seats.tone}`}>{seatText}</span>}
          <div className="trip-overlay">
            <span className="trip-overlay-date"><CalendarDays aria-hidden="true" />{trip.date[lang]}</span>
            <span className="trip-overlay-price"><Tag aria-hidden="true" />{trip.price[lang]}</span>
          </div>
        </div>
      ) : (
        <Link className="experience-image" to="/group-trips/$trip" params={{ trip: trip.id }}>
          <img src={trip.image} alt={trip.name[lang]} loading="lazy" width="600" height="400" />
          <span className="experience-tag">{t('Group Trip', 'رحلة جماعية')}</span>
          {seats && <span className={`trip-seats trip-seats-${seats.tone}`}>{seatText}</span>}
          <div className="trip-overlay">
            <span className="trip-overlay-date"><CalendarDays aria-hidden="true" />{trip.date[lang]}</span>
            <span className="trip-overlay-price"><Tag aria-hidden="true" />{trip.price[lang]}</span>
          </div>
        </Link>
      )}
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
  const { lang } = useLanguage();
  const catalog = useCatalog();
  // Without an explicit list, show the Oman group trips; international ones live under the International tab.
  const groupTrips = trips ?? catalog.groupTrips.filter((g) => tripRegion(g) === 'oman');
  return (
    <section className="trip-part trip-part-group" aria-labelledby="group-trips-title">
      <div className="trip-part-head trip-part-head-main">
        <h3 id="group-trips-title">{groupTripsIntro.title[lang]}</h3>
      </div>
      <TripsIntro content={groupTripsIntro} icons={[MapPin, Sparkles, Users]} />
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
      <a href={`${whatsapp}&text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
        <MessageCircle size={17} />
        {label}
        <ArrowUpRight size={17} />
      </a>
    </Button>
  );
}
