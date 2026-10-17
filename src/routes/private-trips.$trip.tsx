import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { ArrowUpRight, Clock, Fish, MapPin, MessageCircle, Tag, Users } from 'lucide-react';
import { pageHead, bi, cancellationPolicy, privateTripWhatsapp } from '@/lib/content';
import { loadCatalog } from '@/lib/catalog.functions';
import { useLanguage, headLang } from '@/lib/language';
import { Button } from '@/components/ui/button';
import { PrivateBoatSection } from '@/components/private-trip-components';

// Page of one private trip (e.g. the Masirah fishing trip). Everything on it comes from the admin dashboard.
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
  const { lang, t } = useLanguage();
  if (!trip) return null;
  const policy = trip.cancellation && trip.cancellation.length > 0 ? trip.cancellation : cancellationPolicy.items;
  const customPolicy = !!(trip.cancellation && trip.cancellation.length > 0);
  const isFishing = !!trip.tag && /fish|صيد/i.test(`${trip.tag.en} ${trip.tag.ar}`);
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
                  {trip.maxGuests && <span><Users />{t(`Up to ${trip.maxGuests} guests`, `حتى ${trip.maxGuests} أشخاص`)}</span>}
                </div>
              </div>
              {trip.showItinerary && trip.itinerary && trip.itinerary.length > 0 && (
                <div className="detail-section">
                  <h2>{t('Itinerary', 'برنامج الرحلة')}</h2>
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
            </div>
            <aside className="booking-aside">
              <div className="eyebrow">{t('Trip details', 'تفاصيل الرحلة')}</div>
              <ul className="aside-facts">
                {trip.tag && <li>{isFishing ? <Fish size={16} /> : <Tag size={16} />}<span><small>{t('Trip type', 'نوع الرحلة')}</small>{trip.tag[lang]}</span></li>}
                {trip.price && <li><Tag size={16} /><span><small>{t('Price', 'السعر')}</small>{trip.price[lang]}</span></li>}
                {trip.maxGuests && <li><Users size={16} /><span><small>{t('Number of guests', 'عدد الأشخاص')}</small>{t(`Up to ${trip.maxGuests} guests`, `حتى ${trip.maxGuests} أشخاص`)}</span></li>}
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
      {trip.boat && <PrivateBoatSection boat={trip.boat} fallbackName={trip.name[lang]} />}
      {trip.showCancellation !== false && (
        <section className="section section-soft group-trip-page">
          <div className="container">
            <div className="detail-section policy-section">
              <h2>{cancellationPolicy.title[lang]}</h2>
              <ul className="policy-list">{policy.map((item, i) => <li key={i}>{item[lang]}</li>)}</ul>
              {!customPolicy && <p className="policy-note">{cancellationPolicy.note[lang]}</p>}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
