import { useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/language';

/**
 * Photo slideshow used by group-trip cards and the group-trip page.
 *
 * - Swipe on phones (native scroll-snap), arrow buttons on desktop, dots / counter for position.
 * - Works in Arabic (RTL) and English (LTR).
 * - `renderSlide` lets a card wrap every photo in its own link, so tapping a photo still opens the trip.
 */
export function ImageSlider({
  images,
  alt,
  renderSlide,
  eager = false,
  dots = 'top',
}: {
  images: string[];
  alt: string;
  renderSlide?: (img: ReactNode, active: boolean) => ReactNode;
  eager?: boolean;
  dots?: 'top' | 'bottom';
}) {
  const { lang, t } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;
  const rtl = lang === 'ar';

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    setIndex(Math.min(count - 1, Math.max(0, i)));
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const target = ((i % count) + count) % count; // wraps around at both ends
    const sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollTo({ left: sign * target * el.clientWidth, behavior: 'smooth' });
  };

  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <div className="slider" role="group" aria-roledescription="carousel" aria-label={alt}>
      <div className="slider-track" ref={trackRef} onScroll={onScroll}>
        {images.map((src, i) => {
          const img = (
            <img
              src={src}
              alt={i === 0 ? alt : `${alt} (${i + 1}/${count})`}
              loading={eager && i === 0 ? 'eager' : 'lazy'}
              fetchPriority={eager && i === 0 ? 'high' : undefined}
              width="1200"
              height="800"
              draggable={false}
            />
          );
          return (
            <div className="slider-slide" key={src + i} aria-hidden={i !== index}>
              {renderSlide ? renderSlide(img, i === index) : img}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="slider-btn slider-prev"
        aria-label={t('Previous photo', 'الصورة السابقة')}
        onClick={() => goTo(index - 1)}
      >
        <PrevIcon aria-hidden="true" />
      </button>
      <button
        type="button"
        className="slider-btn slider-next"
        aria-label={t('Next photo', 'الصورة التالية')}
        onClick={() => goTo(index + 1)}
      >
        <NextIcon aria-hidden="true" />
      </button>

      {count <= 5 ? (
        <div className={`slider-dots slider-dots-${dots}`}>
          {images.map((_, i) => (
            <button
              type="button"
              key={i}
              className="slider-dot"
              aria-label={t(`Photo ${i + 1} of ${count}`, `الصورة ${i + 1} من ${count}`)}
              aria-current={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      ) : (
        <div className={`slider-dots slider-counter slider-dots-${dots}`} aria-live="polite">
          {index + 1} / {count}
        </div>
      )}
    </div>
  );
}
