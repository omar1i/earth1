import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { ArrowUpRight, Clock, Fish, MapPin, MessageCircle, Tag, Users } from 'lucide-react';
import { pageHead, bi, cancellationPolicy, privateTripWhatsapp } from '@/lib/content';
import { loadCatalog } from '@/lib/catalog.functions';
import { useCatalog } from '@/lib/catalog-context';
import { useLanguage, headLang } from '@/lib/language';
import { Button } from '@/components/ui/button';
import { PrivateBoatSection } from '@/components/private-trip-components';
import { PrivateTripCard } from '@/components/trips-components';

// Page of one private trip (e.g. the Masirah fishing trip). Built like the group-trip page; everything on it comes from the admin dashboard.
export const Route = createFileRoute('/private-trips/$trip')({
  loader: async ({ params }) => {
    const { privateDestinations } = await loadCatalog();
    const trip = privateDestinations.find((x) => x.id === params.trip);
    if (!trip) throw notFound();
    return trip;
  },
  head: ({ loaderData, matches }) => {
    const l = headLang(matches);
    return loaderData
      ? pageHead(l, loaderData.name, loaderData.description)
      : pageHead(l, bi('Trip not found', 'الرحلة غير موجودة'), bi('This trip is unavailable.', 'هذه الرحلة غير متاحة.'));
  },
  component: PrivateTripDetail,
});

function PrivateTripDetail() {
  const trip = Route.useLoaderData();
  const { privateDestinations } = useCatalog();
  const { lang, t } = useLanguage();
  if (!trip) return null;
  const policy = trip.cancellation && trip.cancellation.length > 0 ? trip.cancellation : cancellationPolicy.items;
  const customPolicy = !!(trip.cancellation && trip.cancellation.length > 0);
  const isFishing = !!trip.tag && /fish|صيد/i.test(`${trip.tag.en} ${trip.tag.ar}`);
  const guests = trip.maxGuests ? t(`Up to ${trip.maxGuests} guests`, `حتى ${trip.maxGuests} أشخاص`) : '';
  const others = privateDestinations.filter((x) => x.id !== trip.id);
  return (
    <>
      <section className="image-hero group-hero">
        <img src={trip.image} alt={trip.name[lang]} width="1440" height="1024" fetchPriority="high" />
        <div className="container image-hero-content">
          <div className="eyebrow text-primary-foreground">{trip.tag ? trip.tag[lang] : t('Private Trip', 'رحلة خاصة')}</div>
          <h1>{trip.name[lang]}</h1>
        </div>
      </section>
      <section className="section group-trip-page">
        <div className="container">
          <div className="breadcrumbs">
            <Link to="/" search={{ trips: 'oman' }}>{t('Oman Trips', 'رحلات عمان')}</Link>
            <span>/</span>
            <span>{trip.name[lang]}</span>
          </div>
          {trip.sample && (
            <p className="notice sample-notice">
              {t('Sample content: the price, itinerary and boat details on this page are placeholders and will be confirmed before the trip is announced.', 'محتوى تجريبي: السعر والبرنامج وتفاصيل القارب في هذه الصفحة أمثلة وسيتم تأكيدها قبل الإعلان عن الرحلة.')}
            </p>
          )}
          <div className="detail-layout">
            <div className="detail-copy">
              <div className="detail-section">
                <h2>{isFishing ? t('About this fishing trip', 'نبذة عن رحلة الصيد') : t('About this trip', 'نبذة عن الرحلة')}</h2>
                <p>{trip.description[lang]}</p>
                <div className="experience-meta">
                  {trip.location && <span><MapPin />{trip.location[lang]}</span>}
                  {trip.duration && <span><Clock />{trip.duration[lang]}</span>}
                  {guests && <span><Users />{guests}</span>}
                </div>
              </div>
              {trip.showItinerary && trip.itinerary && trip.itinerary.length > 0 && (
                <div className="detail-section">
                  <h2>{t('Trip Details', 'تفاصيل الرحلة')}</h2>
                  <ol className="itinerary">
                    {trip.itinerary.map((step, i) => (
                      <li key={i}>
                        <strong>{step.title[lang]}</strong>
                        <p>{step.text[lang]}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {trip.boat && <PrivateBoatSection embedded boat={trip.boat} fallbackName={trip.name[lang]} />}
              {trip.showCancellation !== false && (
                <div className="detail-section">
                  <h2>{cancellationPolicy.title[lang]}</h2>
                  <ul className="policy-list">{policy.map((item, i) => <li key={i}>{item[lang]}</li>)}</ul>
                  {!customPolicy && <p className="policy-note">{cancellationPolicy.note[lang]}</p>}
                </div>
              )}
              <div className="detail-section">
                <h2>{t('How to book', 'طريقة الحجز')}</h2>
                <p>{t('Press Book Now to send your booking request and choose your preferred date. Payment and trip details are agreed directly with our team.', 'اضغط احجز الآن لإرسال طلب الحجز واختيار التاريخ المناسب لك. يتم الاتفاق على الدفع وتفاصيل الرحلة مباشرة مع فريقنا.')}</p>
              </div>
            </div>
            <aside className="booking-aside">
              <div className="eyebrow">{t('Trip details', 'تفاصيل الرحلة')}</div>
              <ul className="aside-facts">
                {trip.tag && <li>{isFishing ? <Fish size={16} /> : <Tag size={16} />}<span><small>{t('Trip type', 'نوع الرحلة')}</small>{trip.tag[lang]}</span></li>}
                <li><Tag size={16} /><span><small>{t('Price', 'السعر')}</small>{trip.price ? trip.price[lang] : t('Contact for Price', 'تواصل لمعرفة السعر')}</span></li>
                {guests && <li><Users size={16} /><span><small>{t('Number of guests', 'عدد الأشخاص')}</small>{guests}</span></li>}
                {trip.duration && <li><Clock size={16} /><span><small>{t('Duration', 'المدة')}</small>{trip.duration[lang]}</span></li>}
              </ul>
              <Button asChild size="lg" className="book-btn">
                <Link to="/book" search={{ experience: trip.id }}>
                  {t('Book Now', 'احجز الآن')}
                  <ArrowUpRight size={17} />
                </Link>
              </Button>
              <a className="text-link" href={privateTripWhatsapp(trip.name.en)} target="_blank" rel="noreferrer">
                <MessageCircle />
                {t('Ask us on WhatsApp', 'اسألنا عبر واتساب')}
              </a>
            </aside>
          </div>
        </div>
      </section>
      {others.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header"><h2>{t('More private trips', 'رحلات خاصة أخرى')}</h2></div>
            <div className="trip-grid-4 trip-grid-fit">
              {others.map((x) => <PrivateTripCard key={x.id} d={x} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
