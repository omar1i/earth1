import { useEffect } from 'react';

/**
 * Mobile-only motion layer.
 *
 * This component renders nothing. It only sets data-attributes / CSS variables on existing
 * elements; every visual rule that reads them lives inside `@media (max-width: 950px)` in
 * `styles.css`, so the desktop layout is never affected.
 *
 * What it drives:
 *  - scroll-reveal (fade + rise, staggered) for sections, cards, form blocks and the footer
 *  - header shadow/blur once the page is scrolled + a thin reading-progress bar
 *  - subtle hero parallax
 *  - hiding the floating WhatsApp button while scrolling down (shown again on scroll up)
 *
 * Safety: if the visitor prefers reduced motion, nothing is hidden and no listeners are added.
 * Reveal state uses data-attributes (not classNames) so React re-renders can never wipe it.
 */
const REVEAL_SELECTORS = [
  '.section-header',
  '.trip-part-head',
  '.region-panel-head',
  '.values-layout > div',
  '.values-grid > div',
  '.landscape-content > *',
  '.steps-grid > div',
  '.faq-layout > *',
  '.faq-list details',
  '.category-card',
  '.experience-card',
  '.destination-card',
  '.about-layout > *',
  '.contact-option',
  '.contact-image',
  '.form-layout > *',
  '.detail-section',
  '.booking-aside',
  '.gallery-item',
  '.page-heading .container > *',
  '.image-hero-content > *',
  '.footer-grid > div',
  '.legal-content > *',
  '.notice',
].join(',');

export function MobileEffects() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) return;

    const phone = window.matchMedia('(max-width: 950px)');
    root.classList.add('js-reveal');

    const timers = new Set<number>();

    /* ---------- scroll reveal ---------- */
    const show = (el: Element, delay: number) => {
      (el as HTMLElement).style.setProperty('--rd', `${delay}ms`);
      el.setAttribute('data-reveal', 'in');
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (el.getAttribute('data-reveal') === 'in') el.setAttribute('data-reveal', 'done');
      }, delay + 1000);
      timers.add(id);
    };

    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              let n = 0;
              for (const entry of entries) {
                const el = entry.target;
                if (entry.isIntersecting) {
                  io?.unobserve(el);
                  show(el, Math.min(n++, 5) * 90);
                } else if (entry.boundingClientRect.top < 0) {
                  // Already scrolled past (e.g. anchor jump): reveal silently, no animation.
                  io?.unobserve(el);
                  show(el, 0);
                }
              }
            },
            { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
          )
        : null;

    let firstScan = true;
    const scan = () => {
      if (!phone.matches) return; // desktop widths: do nothing at all
      const vh = window.innerHeight;
      document.querySelectorAll(REVEAL_SELECTORS).forEach((el) => {
        if (el.hasAttribute('data-reveal')) return;
        if (!io) {
          el.setAttribute('data-reveal', 'done');
          return;
        }
        // First paint: don't hide what is already on screen (would flash); only what is below.
        if (firstScan && el.getBoundingClientRect().top < vh * 0.92) {
          el.setAttribute('data-reveal', 'done');
          return;
        }
        el.setAttribute('data-reveal', 'out');
        io.observe(el);
      });
      firstScan = false;
    };

    let scanRaf = 0;
    const scheduleScan = () => {
      if (scanRaf) return;
      scanRaf = requestAnimationFrame(() => {
        scanRaf = 0;
        scan();
      });
    };
    scan();
    // New content after client-side navigation, Oman/International switch, etc.
    const mo = new MutationObserver(scheduleScan);
    mo.observe(document.body, { childList: true, subtree: true });

    /* ---------- scroll state: header, progress, parallax, floating button ---------- */
    let lastY = window.scrollY;
    let ticking = false;
    let headerScrolled: boolean | null = null;
    const update = () => {
      ticking = false;
      // 1) READ first (no layout flush in the middle of the frame)
      const y = Math.max(0, window.scrollY);
      const header = document.querySelector<HTMLElement>('.site-header');
      const hero = document.querySelector<HTMLElement>('.hero');
      const isPhone = phone.matches;
      const heroH = !isPhone && hero ? hero.offsetHeight : 0;
      // 2) then WRITE. Values go on the element that uses them (not on <html>), so the browser
      //    only re-styles that small part of the page on every scroll frame.
      // Header glass state works on every screen size; only touch the DOM when it actually changes.
      const scrolled = y > 8;
      if (header && scrolled !== headerScrolled) {
        headerScrolled = scrolled;
        header.setAttribute('data-scrolled', String(scrolled));
      }
      // Laptop hero: dim it while the white sheet slides up over it (adobe.com style).
      if (hero && !isPhone && heroH) {
        hero.style.setProperty('--hero-dim', Math.min(1, y / (heroH * 0.85)).toFixed(3));
      }
      if (!isPhone) {
        root.removeAttribute('data-scroll-dir');
        return;
      }
      const max = root.scrollHeight - window.innerHeight;
      header?.style.setProperty('--scroll', String(max > 0 ? Math.min(1, y / max) : 0));
      hero?.style.setProperty('--hero-y', String(Math.min(40, y * 0.15)));
      const delta = y - lastY;
      if (Math.abs(delta) > 8) {
        const atBottom = max > 0 && y >= max - 8;
        root.setAttribute('data-scroll-dir', delta > 0 && y > 240 && !atBottom ? 'down' : 'up');
        lastY = y;
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    const onWidthChange = () => {
      scan();
      update();
    };
    phone.addEventListener('change', onWidthChange);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      phone.removeEventListener('change', onWidthChange);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mo.disconnect();
      io?.disconnect();
      if (scanRaf) cancelAnimationFrame(scanRaf);
      timers.forEach((id) => window.clearTimeout(id));
      root.classList.remove('js-reveal');
      root.removeAttribute('data-scroll-dir');
    };
  }, []);

  return null;
}
