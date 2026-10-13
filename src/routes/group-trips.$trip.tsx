import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { ArrowUpRight, CalendarDays, Clock, MapPin, Tag, Users } from 'lucide-react';
import { groupTrips, pageHead, bi } from '@/lib/content';
import { useLanguage, headLang } from '@/lib/language';
import { Button } from '@/components/ui/button';
import { GroupTripCard } from '@/components/trips-components';

export const Route = createFileRoute('/group-trips/$trip')({
  loader: ({ params }) => {
    const trip = groupTrips.find((x) => x.id === params.trip);
    if (!trip) throw notFound();
    return trip.id;
  },
  head: ({ loaderData, matches }) => {
    const trip = groupTrips.find((x) => x.id === loaderData);
    const l = headLang(matches);
    return trip
      ? pageHead(l, trip.name, trip.description)
      : pageHead(l, bi('Trip not found', 'الرحلة غير موجودة'), bi('This trip is unavailable.', 'هذه الرحلة غير متاحة.'));
  },
  component: GroupTripDetail,
});

function GroupTripDetail() {
  const { trip: id } = Route.useParams();
  const { lang, t } = useLanguage();
  const trip = groupTrips.find((x) => x.id === id);
  if (!trip) return null;
  const lists = [
    [t('What’s included', 'ما يشمله السعر'), trip.inclusions],
    [t('What’s not included', 'ما لا يشمله السعر'), trip.exclusions],
    [t('Terms & Conditions', 'الشروط والأحكام'), trip.terms],
  ] as const;

  return (
    <>
      <section className="image-hero">
        <img src={trip.image} alt={trip.name[lang]} width="1440" height="1024" fetchPriority="high" />
        <div className="container image-hero-content">
          <div className="eyebrow text-primary-foreground">{t('Group Trip', 'رحلة جماعية')}</div>
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
              {t('Sample content: the date, price and terms on this page are placeholders and will be confirmed before the trip is announced.', 'محتوى تجريبي: التاريخ والسعر والشروط في هذه الصفحة أمثلة وسيتم تأكيدها قبل الإعلان عن الرحلة.')}
            </p>
          )}
          <div className="detail-layout">
            <div className="detail-copy">
              <div className="detail-section">
                <h2>{t('About this trip', 'نبذة عن الرحلة')}</h2>
                <p>{trip.description[lang]}</p>
                <div className="experience-meta">
                  <span><MapPin />{trip.location[lang]}</span>
                  <span><Clock />{trip.duration[lang]}</span>
                  <span><Users />{trip.groupSize[lang]}</span>
                </div>
              </div>
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
              {lists.map(([title, items]) => (
                <div className="detail-section" key={title}>
                  <h2>{title}</h2>
                  <ul>{items.map((item, i) => <li key={i}>{item[lang]}</li>)}</ul>
                </div>
              ))}
              <div className="detail-section">
                <h2>{t('How to join', 'طريقة الانضمام')}</h2>
                <p>{t('Press Book Now to send your booking request and reserve your seat. Payment and trip details are agreed directly with our team.', 'اضغط احجز الآن لإرسال طلب الحجز وحجز مقعدك. يتم الاتفاق على الدفع وتفاصيل الرحلة مباشرة مع فريقنا.')}</p>
              </div>
            </div>
            <aside className="booking-aside">
              <div className="eyebrow">{t('Trip details', 'تفاصيل الرحلة')}</div>
              <ul className="aside-facts">
                <li><CalendarDays size={16} /><span><small>{t('Trip date', 'تاريخ الرحلة')}</small>{trip.date[lang]}</span></li>
                <li><Tag size={16} /><span><small>{t('Price', 'السعر')}</small>{trip.price[lang]}</span></li>
                <li><Clock size={16} /><span><small>{t('Duration', 'المدة')}</small>{trip.duration[lang]}</span></li>
              </ul>
              <Button asChild size="lg" className="book-btn">
                <Link to="/book" search={{ experience: trip.id }}>
                  {t('Book Now', 'احجز الآن')}
                  <ArrowUpRight size={17} />
                </Link>
              </Button>
            </aside>
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container">
          <div className="section-header"><h2>{t('More group trips', 'رحلات جماعية أخرى')}</h2></div>
          <div className="experience-grid">
            {groupTrips.filter((x) => x.id !== trip.id).map((x) => <GroupTripCard key={x.id} trip={x} />)}
          </div>
        </div>
      </section>
    </>
  );
}
