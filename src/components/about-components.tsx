import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { useLanguage } from '@/lib/language';

/** Fades / lifts an element in the first time it scrolls into view. Content already on screen is never hidden (no flicker). */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92 || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    setArmed(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, className: `${armed ? 'ea-armed' : ''} ${inView ? 'in' : ''}` };
}

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const r = useReveal<HTMLDivElement>();
  return (
    <div ref={r.ref} className={`ea-reveal ${className} ${r.className}`} style={{ '--i': delay } as CSSProperties}>
      {children}
    </div>
  );
}

/** A framed picture: soft skeleton while loading, gentle zoom-out when revealed, slow zoom on hover (desktop). */
export function PhotoFrame({ src, alt, ratio = 1.05, className = '' }: { src: string; alt: string; ratio?: number; className?: string }) {
  const r = useReveal<HTMLElement>();
  const img = useRef<HTMLImageElement>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (img.current && !img.current.complete) setPending(true);
  }, [src]);
  return (
    <figure ref={r.ref} className={`ea-frame ${className} ${r.className}`} style={{ '--ea-ratio': ratio } as CSSProperties}>
      <div className={`ea-frame-inner${pending ? ' pending' : ''}`}>
        <img
          ref={img}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setPending(false)}
          onError={() => setPending(false)}
        />
      </div>
    </figure>
  );
}

/** Mosaic on computers, swipeable strip on phones; every photo opens in a full-screen viewer. */
export function PhotoGallery({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);
  const r = useReveal<HTMLDivElement>();
  const count = Math.min(images.length, 12);
  return (
    <>
      <div ref={r.ref} className={`ea-gallery n${Math.min(count, 4)} ${r.className}`}>
        {images.slice(0, count).map((src, i) => (
          <button
            key={src + i}
            type="button"
            className="ea-tile"
            style={{ '--i': i } as CSSProperties}
            onClick={() => setOpen(i)}
            aria-label={t(`Open photo ${i + 1} of ${count}`, `فتح الصورة ${i + 1} من ${count}`)}
          >
            <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" decoding="async" />
            <span className="ea-zoom" aria-hidden="true">
              <Maximize2 size={16} />
            </span>
          </button>
        ))}
      </div>
      {open !== null && <Lightbox images={images.slice(0, count)} start={open} alt={alt} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({ images, start, alt, onClose }: { images: string[]; start: number; alt: string; onClose: () => void }) {
  const { lang, t } = useLanguage();
  const rtl = lang === 'ar';
  const [index, setIndex] = useState(start);
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const n = images.length;
  const go = useCallback((d: number) => setIndex((i) => (i + d + n) % n), [n]);
  // "next" follows the reading direction: right in English, left in Arabic
  const next = useCallback(() => go(1), [go]);
  const prev = useCallback(() => go(-1), [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') (rtl ? prev : next)();
      else if (e.key === 'ArrowLeft') (rtl ? next : prev)();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, next, prev, rtl]);

  // warm the neighbours so swiping feels instant
  useEffect(() => {
    [index + 1, index - 1].forEach((j) => {
      const src = images[(j + n) % n];
      if (src) new Image().src = src;
    });
  }, [index, images, n]);

  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;
  const node = (
    <div
      className="ea-lb"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const x0 = touchX.current;
        touchX.current = null;
        const x1 = e.changedTouches[0]?.clientX;
        if (x0 === null || x1 === undefined) return;
        const dx = x1 - x0;
        if (Math.abs(dx) < 50) return;
        // swiping towards the start of the line shows the next photo
        (dx < 0 !== rtl ? next : prev)();
      }}
    >
      <button ref={closeRef} type="button" className="ea-lb-btn ea-lb-close" onClick={onClose} aria-label={t('Close', 'إغلاق')}>
        <X size={22} />
      </button>
      {n > 1 && (
        <button type="button" className="ea-lb-btn ea-lb-prev" onClick={prev} aria-label={t('Previous photo', 'الصورة السابقة')}>
          <PrevIcon size={26} />
        </button>
      )}
      <img key={index} src={images[index]} alt={`${alt} ${index + 1}`} draggable={false} />
      {n > 1 && (
        <button type="button" className="ea-lb-btn ea-lb-next" onClick={next} aria-label={t('Next photo', 'الصورة التالية')}>
          <NextIcon size={26} />
        </button>
      )}
      <div className="ea-lb-count" aria-live="polite">
        {index + 1} / {n}
      </div>
    </div>
  );
  return typeof document === 'undefined' ? null : createPortal(node, document.body);
}
