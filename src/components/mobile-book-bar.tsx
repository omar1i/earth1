import { useEffect, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language';

// Phones/tablets only (the CSS hides it on wide screens): a slim "Book Now" bar that slides up once the visitor scrolls past the
// hero photo, and tucks away while the page's own booking card is on screen so the button is never shown twice.
export function MobileBookBar({ experienceId, label, children }: { experienceId: string; label?: string; children?: ReactNode }) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!mq.matches) return setShow(false);
      const hero = document.querySelector('.image-hero');
      const aside = document.querySelector('.booking-aside');
      const pastHero = hero ? hero.getBoundingClientRect().bottom < 64 : window.scrollY > 360;
      const r = aside?.getBoundingClientRect();
      const asideInView = !!r && r.top < window.innerHeight - 24 && r.bottom > 80;
      setShow(pastHero && !asideInView);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // lets the CSS lift the floating WhatsApp button and keep the footer readable while the bar is up
  useEffect(() => {
    const root = document.documentElement;
    if (show) root.setAttribute('data-book-bar', 'on');
    else root.removeAttribute('data-book-bar');
    return () => root.removeAttribute('data-book-bar');
  }, [show]);

  return (
    <div className={`mobile-book-bar${show ? ' is-visible' : ''}`} aria-hidden={!show}>
      <div className="mbb-info">
        {label && <small>{label}</small>}
        <strong>{children}</strong>
      </div>
      <Button asChild size="lg" className="mbb-btn">
        <Link to="/book" search={{ experience: experienceId }} tabIndex={show ? 0 : -1}>
          {t('Book Now', 'احجز الآن')}
          <ArrowUpRight size={17} />
        </Link>
      </Button>
    </div>
  );
}
