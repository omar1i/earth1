import { useEffect, useState, type KeyboardEvent } from 'react';
import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { ArrowUpRight, Clock, Fish, ListChecks, MapPin, MessageCircle, Ship, ShieldCheck, Tag, Users } from 'lucide-react';
import { pageHead, bi, cancellationPolicy, privateTripWhatsapp } from '@/lib/content';
import { loadCatalog } from '@/lib/catalog.functions';
import { useCatalog } from '@/lib/catalog-context';
import { useLanguage, headLang } from '@/lib/language';
import { Button } from '@/components/ui/button';
import { MobileBookBar } from '@/components/mobile-book-bar';
import { PrivateBoatSection } from '@/components/private-trip-components';
import { AboutMasirah } from '@/components/about-masirah';
import { getSiteImages } from '@/lib/site-images.functions';
import type { SiteImages } from '@/lib/site-images';
import { resolveImage } from '@/lib/catalog';
import { PrivateTripCard } from '@/components/trips-components';

// Page of one private trip (e.g. the Masirah fishing trip). Built like the group-trip page; everything on it comes from the admin dashboard.
export const Route = createFileRoute('/private-trips/$trip')({
  loader: async ({ params }) => {
    const { privateDestinations } = await loadCatalog();
    const trip = privateDestinations.find((x) => x.id === params.trip);
    if (!trip) throw notFound();
    // The fish photos shown in the "About Masirah" section are chosen in the admin panel (About page tab).
    const siteImages: SiteImages = trip.id === 'masirah-island' ? await getSiteImages() : {};
    return { ...trip, siteImages };
  },
  head: ({ loaderData, matches }) => {
    const l = headLang(matches);
    return loaderData
      ? pageHead(l, loaderData.name, loaderData.description)
      : pageHead(l, bi('Trip not found', 'الرحلة غير موجودة'), bi('This trip is unavailable.', 'هذه الرحلة غير متاحة.'));
  },
  component: PrivateTripDetail,
});

type TripTab = 'boat' | 'details' | 'policy';

function PrivateTripDetail() {
  const trip = Route.useLoaderData();
  const { privateDestinations } = useCatalog();
  const { lang, t } = useLanguage();
  // Three buttons under the hero photo: Our Boat / Trip Details / Cancellation Policy. Each one shows only its own content.
  const [tab, setTab] = useState<TripTab>('details');
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (h === 'boat' || h === 'policy' || h === 'details') setTab(h);
  }, []);
  if (!trip) return null;
  const policy = trip.cancellation && trip.cancellation.length > 0 ? trip.cancellation : cancellationPolicy.items;
  const customPolicy = !!(trip.cancellation && trip.cancellation.length > 0);
  // Custom policies are often saved as one long paragraph: show one bullet per line / sentence.
  // (The default policy is already a list of separate points, so it is left as is.)
  const policyPoints = customPolicy
    ? policy.flatMap((item) =>
        item[lang]
          .replace(/([.\u061F?!])\s+/g, '$1\n')
          .split(/\n+/)
          .map((x) => x.trim())
          .filter(Boolean),
      )
    : policy.map((item) => item[lang]);
  const isFishing = !!trip.tag && /fish|صيد/i.test(`${trip.tag.en} ${trip.tag.ar}`);
  const guests = trip.maxGuests ? t(`Up to ${trip.maxGuests} guests`, `حتى ${trip.maxGuests} أشخاص`) : '';
  const others = privateDestinations.filter((x) => x.id !== trip.id);
  const hasPolicy = trip.showCancellation !== false;
  const tabs: { id: TripTab; label: string; Icon: typeof Ship }[] = [
    ...(trip.boat ? [{ id: 'boat' as const, label: t('Our Boat', 'قاربنا'), Icon: Ship }] : []),
    { id: 'details' as const, label: t('Trip Details', 'تفاصيل الرحلة'), Icon: ListChecks },
    ...(hasPolicy ? [{ id: 'policy' as const, label: cancellationPolicy.title[lang], Icon: ShieldCheck }] : []),
  ];
  const active: TripTab = tabs.some((x) => x.id === tab) ? tab : 'details';
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = (e.key === 'ArrowRight' ? 1 : -1) * (lang === 'ar' ? -1 : 1);
    const i = tabs.findIndex((x) => x.id === active);
    const next = tabs[(i + step + tabs.length) % tabs.length];
    if (!next) return;
    setTab(next.id);
    document.getElementById(`trip-tab-${next.id}`)?.focus();
  };
  return (
    <>
      <section className="image-hero group-hero">
        <img src={trip.image} alt={trip.name[lang]} width="1440" height="1024" fetchPriority="high" />
        <div className="container image-hero-content">
          <div className="eyebrow text-primary-foreground">{trip.tag ? trip.tag[lang] : t('Private Trip', 'رحلة خاصة')}</div>
          <h1>{trip.name[lang]}</h1>
        </div>
      </section>
      <div className="trip-tabs-bar">
        <div className="container">
          <div className="trip-tabs" role="tablist" aria-label={t('Trip sections', 'أقسام الرحلة')}>
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`trip-tab-${id}`}
                aria-selected={active === id}
                aria-controls="trip-panel"
                tabIndex={active === id ? 0 : -1}
                className="trip-tab"
                onClick={() => setTab(id)}
                onKeyDown={onTabKey}
              >
                <Icon aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
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
              <div className="trip-panel" role="tabpanel" id="trip-panel" aria-labelledby={`trip-tab-${active}`} key={active}>
                {active === 'details' && (
                  <>
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
                    <div className="detail-section">
                      <h2>{t('How to book', 'طريقة الحجز')}</h2>
                      <p>{t('Press Book Now to send your booking request and choose your preferred date. Payment and trip details are agreed directly with our team.', 'اضغط احجز الآن لإرسال طلب الحجز واختيار التاريخ المناسب لك. يتم الاتفاق على الدفع وتفاصيل الرحلة مباشرة مع فريقنا.')}</p>
                    </div>
                  </>
                )}
                {active === 'boat' && trip.boat && <PrivateBoatSection embedded boat={trip.boat} fallbackName={trip.name[lang]} />}
                {active === 'policy' && hasPolicy && (
                  <div className="detail-section">
                    <h2>{cancellationPolicy.title[lang]}</h2>
                    <ul className="policy-list">{policyPoints.map((text, i) => <li key={i}>{text}</li>)}</ul>
                    {!customPolicy && <p className="policy-note">{cancellationPolicy.note[lang]}</p>}
                  </div>
                )}
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
      {trip.id === 'masirah-island' && (
        <AboutMasirah
          tripId={trip.id}
          tripName={trip.name.en}
          photos={{
            tuna: resolveImage(trip.siteImages.fishTuna),
            kingfish: resolveImage(trip.siteImages.fishKingfish),
            grouper: resolveImage(trip.siteImages.fishGrouper),
            reef: resolveImage(trip.siteImages.fishReef),
          }}
        />
      )}
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
      <MobileBookBar experienceId={trip.id} label={t('Price', 'السعر')}>{trip.price ? trip.price[lang] : t('Contact for Price', 'تواصل لمعرفة السعر')}</MobileBookBar>
    </>
  );
}
