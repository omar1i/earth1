import { useRef } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, MessageCircle, Quote, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language';
import { whatsapp } from '@/lib/content';
import { reviews, tripadvisor } from '@/lib/reviews';

function Stars({ n }: { n: number }) {
  const { t } = useLanguage();
  return (
    <span className="rv-stars" role="img" aria-label={t(`Rated ${n} out of 5`, `تقييم ${n} من 5`)}>
      {Array.from({ length: 5 }, (_, i) => <Star key={i} size={15} className={i < n ? 'on' : ''} aria-hidden="true" />)}
    </span>
  );
}

// "Guest stories": rating strip + swipeable postcard-style cards + a "leave your words" card. No auto-moving parts (only swipe / arrows).
export function ReviewsSection() {
  const { lang, t } = useLanguage();
  const track = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.rv-card');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 18), behavior: 'smooth' });
  };

  return (
    <section className="section reviews-section" aria-labelledby="reviews-title">
      <div className="container">
        <div className="reviews-head">
          <div>
            <div className="eyebrow">{t('Guest stories', 'قصص ضيوفنا')}</div>
            <h2 id="reviews-title" className="section-title">{t('What our guests say', 'ماذا يقول ضيوفنا')}</h2>
            <p className="section-intro">{t('Real words from real adventures, shared by our guests on Tripadvisor.', 'كلمات حقيقية من مغامرات حقيقية، شاركها ضيوفنا على Tripadvisor.')}</p>
          </div>
          <a className="rv-score" href={tripadvisor.url} target="_blank" rel="noreferrer" aria-label={t('Read all reviews on Tripadvisor', 'اقرأ كل التقييمات على Tripadvisor')}>
            <span className="rv-score-num">{tripadvisor.rating.toFixed(1)}</span>
            <span className="rv-score-meta">
              <Stars n={5} />
              <strong>{t(`${tripadvisor.count} reviews on Tripadvisor`, `${tripadvisor.count} تقييمًا على Tripadvisor`)}</strong>
              <small>{t(`Ranked #${tripadvisor.rank} of ${tripadvisor.rankOf} tours & activities in Muscat`, `المركز ${tripadvisor.rank} من ${tripadvisor.rankOf} في الجولات والأنشطة بمسقط`)}</small>
            </span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>

        <div className="rv-track" ref={track} tabIndex={0} role="region" aria-label={t('Guest reviews', 'تقييمات الضيوف')}>
          {reviews.map((r) => {
            const useAr = lang === 'ar' && !!r.text.ar;
            return (
              <article className="rv-card" key={r.id}>
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
          })}
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
        </div>

        <div className="rv-foot">
          <a className="text-link" href={tripadvisor.url} target="_blank" rel="noreferrer">
            {t('Read all reviews on Tripadvisor', 'اقرأ كل التقييمات على Tripadvisor')}
            <ArrowUpRight size={14} />
          </a>
          <div className="rv-arrows">
            <button type="button" onClick={() => scrollBy(-1)} aria-label={t('Scroll left', 'تمرير لليسار')}><ChevronLeft size={20} /></button>
            <button type="button" onClick={() => scrollBy(1)} aria-label={t('Scroll right', 'تمرير لليمين')}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
