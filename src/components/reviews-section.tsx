import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowUpRight, ChevronLeft, ChevronRight, MessageCircle, Quote, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language';
import { whatsapp } from '@/lib/content';
import { reviews, tripadvisor, type GuestReview } from '@/lib/reviews';

export function Stars({ n }: { n: number }) {
  const { t } = useLanguage();
  return (
    <span className="rv-stars" role="img" aria-label={t(`Rated ${n} out of 5`, `تقييم ${n} من 5`)}>
      {Array.from({ length: 5 }, (_, i) => <Star key={i} size={15} className={i < n ? 'on' : ''} aria-hidden="true" />)}
    </span>
  );
}

/** The 4.9 / 47 reviews / ranking card (links to the Tripadvisor page). */
export function ReviewScore() {
  const { t } = useLanguage();
  return (
    <a className="rv-score" href={tripadvisor.url} target="_blank" rel="noreferrer" aria-label={t('Read all reviews on Tripadvisor', 'اقرأ كل التقييمات على Tripadvisor')}>
      <span className="rv-score-num">{tripadvisor.rating.toFixed(1)}</span>
      <span className="rv-score-meta">
        <Stars n={5} />
        <strong>{t(`${tripadvisor.count} reviews on Tripadvisor`, `${tripadvisor.count} تقييمًا على Tripadvisor`)}</strong>
        <small>{t(`Ranked #${tripadvisor.rank} of ${tripadvisor.rankOf} tours & activities in Muscat`, `المركز ${tripadvisor.rank} من ${tripadvisor.rankOf} في الجولات والأنشطة بمسقط`)}</small>
      </span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}

/** One postcard-style review. */
export function ReviewCard({ r }: { r: GuestReview }) {
  const { lang } = useLanguage();
  const useAr = lang === 'ar' && !!r.text.ar;
  return (
    <article className="rv-card">
      <div className="rv-top">
        <Quote className="rv-quote" size={26} aria-hidden="true" />
        <span className="rv-stamp">{r.date[lang]}</span>
      </div>
      {r.headline && <h3 lang="en" dir="ltr">{r.headline.en}</h3>}
      <blockquote>
        <p lang={useAr ? 'ar' : 'en'} dir={useAr ? 'rtl' : 'ltr'}>{useAr ? r.text.ar : r.text.en}</p>
      </blockquote>
      <footer className="rv-who">
        <span className="rv-avatar" aria-hidden="true">{r.name.charAt(0).toUpperCase()}</span>
        <span className="rv-who-text"><strong dir="ltr">{r.name}</strong><small>{r.meta[lang]}</small></span>
        <Stars n={r.stars} />
      </footer>
    </article>
  );
}

/** "Been on an adventure with us?" card: write a review on Tripadvisor, or send a note on WhatsApp. */
export function ReviewCta() {
  const { t } = useLanguage();
  return (
    <article className="rv-card rv-cta">
      <h3>{t('Been on an adventure with us?', 'عشت مغامرة معنا؟')}</h3>
      <p>{t('Tell the next traveler how it felt.', 'احكِ للمسافر القادم كيف كانت تجربتك.')}</p>
      <Button asChild size="lg" className="rv-cta-btn">
        <a href={tripadvisor.writeUrl} target="_blank" rel="noreferrer">
          {t('Write a review', 'اكتب تقييمك')}
          <ArrowUpRight size={17} />
        </a>
      </Button>
      <a className="text-link" href={whatsapp} target="_blank" rel="noreferrer">
        <MessageCircle size={15} />
        {t('Or send us a note', 'أو أرسل لنا ملاحظة')}
      </a>
    </article>
  );
}

/** Tripadvisor-style summary header: logo tile, rating, stars, count and a "Share your feedback" button. */
export function ReviewsSummary() {
  const { t } = useLanguage();
  return (
    <div className="rvp-summary">
      <div className="rvp-summary-main">
        <span className="rvp-logo" aria-hidden="true"><Star size={26} fill="currentColor" /></span>
        <div>
          <h2>{t('Tripadvisor Reviews', 'تقييمات Tripadvisor')}</h2>
          <a className="rvp-rating" href={tripadvisor.url} target="_blank" rel="noreferrer" aria-label={t('Read all reviews on Tripadvisor', 'اقرأ كل التقييمات على Tripadvisor')}>
            <strong>{tripadvisor.rating.toFixed(1)}</strong>
            <Stars n={5} />
            <span>({tripadvisor.count})</span>
          </a>
          <small>{t(`Ranked #${tripadvisor.rank} of ${tripadvisor.rankOf} tours & activities in Muscat`, `المركز ${tripadvisor.rank} من ${tripadvisor.rankOf} في الجولات والأنشطة بمسقط`)}</small>
        </div>
      </div>
      <a className="rvp-share" href={tripadvisor.writeUrl} target="_blank" rel="noreferrer">
        {t('Share your feedback', 'شاركنا رأيك')}
      </a>
    </div>
  );
}

function CarouselCard({ r }: { r: GuestReview }) {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const useAr = lang === 'ar' && !!r.text.ar;
  const text = useAr ? r.text.ar! : r.text.en;
  const long = text.length > 120;
  return (
    <article className="rvp-card">
      <Stars n={r.stars} />
      {r.headline && <h3 lang="en" dir="ltr">{r.headline.en}</h3>}
      <p className={open ? 'open' : ''} lang={useAr ? 'ar' : 'en'} dir={useAr ? 'rtl' : 'ltr'}>{text}</p>
      {long && (
        <button type="button" className="rvp-more" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? t('Show less', 'عرض أقل') : t('Read more', 'اقرأ المزيد')}
        </button>
      )}
      <footer className="rvp-who">
        <span className="rvp-avatar" aria-hidden="true">{r.name.charAt(0).toUpperCase()}</span>
        <span className="rvp-who-text"><strong dir="ltr">{r.name}</strong><small>{r.meta[lang]} · {r.date[lang]}</small></span>
        <Quote className="rvp-quote" size={22} aria-hidden="true" />
      </footer>
    </article>
  );
}

/** Swipeable reviews slider with arrows and dots (follows the page direction, so it works in Arabic too). */
export function ReviewsCarousel() {
  const { lang, t } = useLanguage();
  const [ref, api] = useEmblaCarousel({ align: 'start', slidesToScroll: 1, direction: lang === 'ar' ? 'rtl' : 'ltr', containScroll: 'trimSnaps' });
  const [index, setIndex] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const sync = useCallback(() => {
    if (!api) return;
    setIndex(api.selectedScrollSnap());
    setSnaps(api.scrollSnapList());
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    sync();
    api.on('select', sync).on('reInit', sync);
    return () => { api.off('select', sync).off('reInit', sync); };
  }, [api, sync]);

  const rtl = lang === 'ar';
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;

  return (
    <div className="rvp-carousel" role="region" aria-roledescription="carousel" aria-label={t('Guest reviews', 'تقييمات الضيوف')}>
      <button type="button" className="rvp-arrow prev" onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label={t('Previous review', 'التقييم السابق')}><Prev size={18} /></button>
      <div className="rvp-viewport" ref={ref}>
        <div className="rvp-track">
          {reviews.map((r) => <div className="rvp-slide" key={r.id}><CarouselCard r={r} /></div>)}
        </div>
      </div>
      <button type="button" className="rvp-arrow next" onClick={() => api?.scrollNext()} disabled={!canNext} aria-label={t('Next review', 'التقييم التالي')}><Next size={18} /></button>
      <div className="rvp-dots">
        {snaps.map((_, i) => (
          <button key={i} type="button" className={i === index ? 'on' : ''} onClick={() => api?.scrollTo(i)} aria-label={t(`Go to review ${i + 1}`, `اذهب إلى التقييم ${i + 1}`)} aria-current={i === index} />
        ))}
      </div>
    </div>
  );
}
