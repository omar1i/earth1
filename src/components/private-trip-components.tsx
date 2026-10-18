import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import {
  Anchor, BriefcaseMedical, Check, Clock, Fish, Fuel, Gauge, LifeBuoy, Music, Navigation, Radar, Ruler,
  ShowerHead, Ship, Snowflake, Sun, Umbrella, Users, Glasses, Waves,
} from 'lucide-react';
import { useLanguage } from '@/lib/language';
import type { PrivateBoat } from '@/lib/content';

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;

// The admin writes free text, so icons are picked from keywords (English or Arabic). The first matching rule wins,
// so the more specific words come first (e.g. "trolling motor for fishing" must not get the fish icon).
// Unknown text gets a check mark.
const pick = (text: string, rules: [RegExp, Icon][], fallback: Icon): Icon => rules.find(([re]) => re.test(text))?.[1] ?? fallback;
const specRules: [RegExp, Icon][] = [
  [/length|طول/i, Ruler], [/engine|motor|\bhp\b|محرك/i, Gauge], [/capacity|guest|people|seat|سعة|أشخاص|ضيوف/i, Users],
  [/marina|port|depart|مرسى|ميناء|انطلاق/i, Anchor], [/trip|type|duration|time|نوع|مدة|رحلة/i, Clock],
];
const capacityRe = /capacity|guest|people|seat|سعة|أشخاص|ضيوف/i;
const amenityRules: [RegExp, Icon][] = [
  [/trolling|motor|محرك/i, Waves], [/shower|bath|toilet|حمّ?ام|دش/i, ShowerHead], [/radar|fish ?finder|sonar|رادار/i, Radar],
  [/life|jacket|vest|نجاة/i, LifeBuoy], [/gps|navig|ملاحة/i, Navigation], [/first aid|medical|إسعاف/i, BriefcaseMedical],
  [/snorkel|mask|غطس/i, Glasses], [/side|curtain|sadaf|صداف|جانب/i, Umbrella], [/shade|canopy|\bsun|مظلة|شمس/i, Sun],
  [/cooler|\bice\b|تبريد|ثلج/i, Snowflake], [/fuel|وقود/i, Fuel], [/speaker|music|bluetooth|سماعة/i, Music],
  [/fish|tank|catch|live ?well|mahya|صيد|سمك|خزان|محي/i, Fish],
];

// ---- Interactive boat drawing ----------------------------------------------------------------------------------
// Parts of the boat that can light up. A part only gets a glowing dot when the boat's text mentions it, so the same
// drawing works for any boat added in the admin dashboard. x / y are positions inside the 640 x 280 drawing.
type ZoneId = 'sides' | 'canopy' | 'finder' | 'bath' | 'well' | 'engine';
const zones: { id: ZoneId; re: RegExp; x: number; y: number }[] = [
  { id: 'sides', re: /side|curtain|sadaf|صداف|جانب/i, x: 249, y: 112 },
  { id: 'canopy', re: /canopy|shade|\bsun|مظلة|شمس/i, x: 340, y: 64 },
  { id: 'finder', re: /radar|fish ?finder|sonar|رادار/i, x: 349, y: 137 },
  { id: 'bath', re: /shower|bath|toilet|حمّ?ام|دش/i, x: 503, y: 130 },
  { id: 'well', re: /live ?well|mahya|fish ?tank|محي|خزان (ال)?صيد|خزان سمك/i, x: 153, y: 138 },
  { id: 'engine', re: /engine|motor|\bhp\b|horsepower|mercury|محرك|ميركوري/i, x: 56, y: 178 },
];
const zoneOf = (...parts: string[]): ZoneId | null => {
  const text = parts.join(' ');
  return zones.find((z) => z.re.test(text))?.id ?? null;
};

// Wave outline: a sine-like strip, 16 x 80 units wide so it can slide one full 640 units without a visible jump.
const wave = (y: number, amp: number) => `M0 ${y} ${`q20 -${amp} 40 0 t40 0 `.repeat(16)}V300H0Z`;

function BoatDrawing() {
  return (
    <svg className="bt-svg" viewBox="0 0 640 280" role="presentation" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bt-hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#cfe0ee" /></linearGradient>
        <linearGradient id="bt-stripe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1c6fd0" /><stop offset="1" stopColor="#35a0f0" /></linearGradient>
        <linearGradient id="bt-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4fbff" /><stop offset="1" stopColor="#b7d3e8" /></linearGradient>
        <linearGradient id="bt-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#35a0f0" stopOpacity=".55" /><stop offset="1" stopColor="#007adb" stopOpacity=".6" /></linearGradient>
        <linearGradient id="bt-water-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7cc3f5" stopOpacity=".45" /><stop offset="1" stopColor="#1c6fd0" stopOpacity=".5" /></linearGradient>
        <linearGradient id="bt-engine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0d2236" /><stop offset=".5" stopColor="#27465f" /><stop offset="1" stopColor="#10283d" /></linearGradient>
      </defs>

      <g className="bt-wave bt-wave-back"><path d={wave(196, 9)} fill="url(#bt-water-back)" /></g>

      <g className="bt-boat">
        {/* fishing rods */}
        <g className="bt-rods" stroke="#0e2b44" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M112 146 L34 62" /><path d="M128 146 L62 54" /><path d="M34 62 Q26 120 30 188" strokeWidth="1" opacity=".55" />
        </g>

        {/* the two outboard engines */}
        <g className="bt-z bt-z-engine">
          <g>
            <rect x="48" y="148" width="34" height="60" rx="11" fill="url(#bt-engine)" />
            <path d="M52 156 Q64 150 78 158" stroke="#5f86a3" strokeWidth="2" fill="none" opacity=".6" />
            <path d="M58 207 L74 207 L71 238 L61 238 Z" fill="#12293d" />
            <path d="M54 242 L78 242 L76 248 L56 248 Z" fill="#0c1d2d" />
          </g>
          <g transform="translate(-14 4)">
            <rect x="48" y="148" width="34" height="60" rx="11" fill="url(#bt-engine)" />
            <path d="M52 156 Q64 150 78 158" stroke="#7fa6c2" strokeWidth="2" fill="none" opacity=".7" />
            <path d="M58 207 L74 207 L71 238 L61 238 Z" fill="#16324a" />
            <path d="M54 242 L78 242 L76 248 L56 248 Z" fill="#0c1d2d" />
          </g>
        </g>

        {/* hull */}
        <path d="M68 150 L420 146 C490 142 545 134 588 120 C575 175 525 214 440 228 L150 228 C104 220 74 190 68 150 Z" fill="url(#bt-hull)" stroke="#0e2b44" strokeOpacity=".4" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M70 166 L424 162 C492 158 548 148 582 136 L577 150 C545 160 492 172 424 176 L71 181 Z" fill="url(#bt-stripe)" />
        <path d="M70 152 L422 148" stroke="#a9c4d9" strokeWidth="2" />

        {/* live well hatch */}
        <g className="bt-z bt-z-well">
          <rect x="116" y="136" width="74" height="14" rx="4" fill="#8fd0ee" stroke="#e8f6ff" strokeWidth="2" />
          <path d="M128 143 H178" stroke="#e8f6ff" strokeWidth="2" strokeLinecap="round" opacity=".8" />
        </g>

        {/* forward cabin with the bathroom */}
        <g className="bt-z bt-z-bath">
          <path d="M432 146 L438 122 Q474 110 540 114 L568 128 L572 146 Z" fill="url(#bt-hull)" stroke="#0e2b44" strokeOpacity=".4" strokeWidth="1.2" />
          <path d="M452 130 L520 124 L538 130 L538 138 L452 140 Z" fill="#0f3a58" opacity=".85" />
          <path d="M456 133 L506 129" stroke="#7fd0ff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        </g>

        {/* poles */}
        <g stroke="#8aa8c0" strokeWidth="4" strokeLinecap="round">
          <path d="M214 76 L210 146" /><path d="M452 70 L450 146" /><path d="M330 98 L330 80" />
        </g>

        {/* side shade curtains */}
        <g className="bt-z bt-z-sides">
          <path d="M198 76 L300 72 L300 140 L198 144 Z" fill="#ffffff" fillOpacity=".2" stroke="#ffffff" strokeOpacity=".45" strokeWidth="1.5" />
          <path d="M224 75 V142 M250 74 V141 M276 73 V140" stroke="#ffffff" strokeOpacity=".35" strokeWidth="1.5" />
        </g>

        {/* console, windshield and fish-finder screen */}
        <g className="bt-z bt-z-finder">
          <path d="M310 146 L314 108 Q316 102 324 100 L372 96 Q380 96 382 104 L392 146 Z" fill="#17324a" />
          <path d="M318 112 L374 104 L380 120 L320 126 Z" fill="#7fd0ff" fillOpacity=".38" stroke="#bfe8ff" strokeOpacity=".7" strokeWidth="1.5" />
          <rect x="335" y="128" width="30" height="16" rx="3" fill="#06202f" stroke="#3a6786" strokeWidth="1.5" />
          <path className="bt-blip" d="M339 138 H346 L349 132 L353 141 L357 135 H361" stroke="#b6ff4d" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M392 66 Q404 46 416 66 Z" fill="#e8f4fb" stroke="#9cc3dc" strokeWidth="1.5" />
        </g>

        {/* sun canopy */}
        <g className="bt-z bt-z-canopy">
          <path d="M200 64 L470 58 Q484 58 482 70 L196 78 Q188 70 200 64 Z" fill="url(#bt-roof)" stroke="#0e2b44" strokeOpacity=".35" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M204 72 L476 66" stroke="#7dc918" strokeWidth="3" strokeLinecap="round" opacity=".95" />
        </g>
      </g>

      {/* fish finder: sonar pings below the hull + a few fish */}
      <g className="bt-sonar" fill="none" stroke="#7dc918" strokeWidth="2">
        <ellipse cx="300" cy="232" rx="12" ry="4" /><ellipse cx="300" cy="232" rx="12" ry="4" /><ellipse cx="300" cy="232" rx="12" ry="4" />
      </g>
      <g className="bt-fish" fill="#5fa80f">
        <path className="bt-fish-1" d="M0 0 C8 -7 20 -7 28 0 C20 7 8 7 0 0 Z M28 0 L37 -6 L37 6 Z" />
        <path className="bt-fish-2" d="M0 0 C8 -7 20 -7 28 0 C20 7 8 7 0 0 Z M28 0 L37 -6 L37 6 Z" />
        <path className="bt-fish-3" d="M0 0 C8 -7 20 -7 28 0 C20 7 8 7 0 0 Z M28 0 L37 -6 L37 6 Z" />
      </g>

      <g className="bt-wave bt-wave-front"><path d={wave(203, 8)} fill="url(#bt-water)" /></g>
    </svg>
  );
}

// ---- small helpers ---------------------------------------------------------------------------------------------
// Plays an entrance only for content that is below the fold; content already on screen is never hidden (no flicker).
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [armed, setArmed] = useState(false);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window) || el.getBoundingClientRect().top < window.innerHeight * 0.85) {
      setGo(true);
      return;
    }
    setArmed(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setGo(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, armed, go, cls: `${armed ? 'bt-armed' : ''} ${go ? 'bt-in' : ''}` };
}

// "37 ft" / "2 × Mercury, 300 HP each": the biggest number in the text counts up when the card appears.
function CountUp({ text, armed, go }: { text: string; armed: boolean; go: boolean }) {
  const nums = [...text.matchAll(/\d+(?:\.\d+)?/g)];
  const best = nums.reduce<RegExpMatchArray | null>((m, n) => (!m || Number(n[0]) > Number(m[0]) ? n : m), null);
  const target = best ? Number(best[0]) : 0;
  const has = best !== null;
  const [shown, setShown] = useState(target);
  useEffect(() => {
    if (!has || !armed) return;
    if (!go) {
      setShown(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1300);
      setShown(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [armed, go, target, has]);
  if (!best || best.index === undefined) return <>{text}</>;
  const i = best.index;
  // the final number is rendered invisibly underneath so the card keeps its final width while the digits count up (no layout shift)
  const live = shown === Math.round(target) ? best[0] : String(shown);
  return (
    <>
      {text.slice(0, i)}
      <span className="bt-num" aria-label={best[0]}>
        <span className="bt-num-ghost" aria-hidden="true">{best[0]}</span>
        <span className="bt-num-live" aria-hidden="true">{live}</span>
      </span>
      {text.slice(i + best[0].length)}
    </>
  );
}

// Capacity as little people: one per guest, plus one lime figure for each crew member named (Nakhuda, Captain...).
const crewRes = [/nakhuda|nokhada|نوخذ|ناخوذ|نوخذه/i, /captain|skipper|كابتن|ربان/i, /deckhand|crew|طاقم|بحار/i];
function People({ text }: { text: string }) {
  const n = Number(text.match(/\d+/)?.[0]);
  if (!Number.isFinite(n) || n < 1 || n > 14) return null;
  const crew = crewRes.filter((re) => re.test(text)).length;
  const person = (key: string, i: number, cls: string) => (
    <svg key={key} className={`bt-person ${cls}`} style={{ '--k': i } as CSSProperties} viewBox="0 0 20 28" aria-hidden="true">
      <circle cx="10" cy="7" r="5" /><path d="M2 27 C2 16 6 13 10 13 C14 13 18 16 18 27 Z" />
    </svg>
  );
  return (
    <span className="bt-people" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => person('g' + i, i, 'bt-guest'))}
      {Array.from({ length: crew }, (_, i) => person('c' + i, n + i, 'bt-crew'))}
    </span>
  );
}

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;

// "Our Boat": a light brand-coloured panel. A drawing of the boat whose parts light up together with the matching cards,
// spec cards that count up, and the equipment as floating chips.
export function PrivateBoatSection({ boat, fallbackName, embedded = false }: { boat: PrivateBoat; fallbackName: string; embedded?: boolean }) {
  const { lang, t } = useLanguage();
  const label = t('Our Boat', 'قاربنا');
  const title = boat.name[lang] || label;
  const showLabel = title.trim() !== label; // no "Our Boat / Our Boat" when the boat has no name of its own

  const [hover, setHover] = useState<ZoneId | null>(null);
  const [pin, setPin] = useState<ZoneId | null>(null);
  const active = hover ?? pin;
  const bind = (zone: ZoneId | null | undefined) =>
    zone
      ? {
          onMouseEnter: () => setHover(zone),
          onMouseLeave: () => setHover(null),
          onFocus: () => setHover(zone),
          onBlur: () => setHover(null),
          onClick: () => setPin((p) => (p === zone ? null : zone)),
        }
      : {};

  const specZones = boat.specs.map((s) => zoneOf(s.label.en, s.label.ar, s.value.en, s.value.ar));
  const amenityZones = boat.amenities.map((a) => zoneOf(a.en, a.ar));
  // text shown on a glowing dot: the first item that mentions that part of the boat
  const tipFor = (id: ZoneId): string => {
    const a = boat.amenities.find((_, i) => amenityZones[i] === id);
    if (a) return a[lang];
    const si = specZones.indexOf(id);
    const spec = si >= 0 ? boat.specs[si] : undefined;
    return spec ? `${spec.label[lang]}: ${spec.value[lang]}` : '';
  };
  const pins = zones.filter((z) => specZones.includes(z.id) || amenityZones.includes(z.id));

  const stageRef = useRef<HTMLDivElement>(null);
  const scene = useInView<HTMLDivElement>();
  const tiles = useInView<HTMLDListElement>();
  const chips = useInView<HTMLDivElement>();
  const rtl = lang === 'ar';
  const hasStageEl = boat.specs.length > 0 || boat.amenities.length > 0;
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => { if (e) el.classList.toggle('bt-offscreen', !e.isIntersecting); }, { rootMargin: '80px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasStageEl]);
  const hasStage = boat.specs.length > 0 || boat.amenities.length > 0;

  const body = (
    <>
        <div className={boat.image ? 'boat-head has-image' : 'boat-head'}>
          <div className="boat-intro">
            {showLabel && <div className="eyebrow">{label}</div>}
            <h2 id="our-boat-title" className="section-title">{title}</h2>
            {boat.tagline[lang] && <p className="boat-tagline">{boat.tagline[lang]}</p>}
            {boat.description[lang] && <p className="boat-text">{boat.description[lang]}</p>}
          </div>
          {boat.image && (
            <figure className="boat-photo">
              <img src={boat.image} alt={`${title} · ${fallbackName}`} loading="lazy" width="900" height="600" />
            </figure>
          )}
        </div>

        {hasStage && (
          <div className="bt-stage" ref={stageRef}>
            <div ref={scene.ref} className={`bt-scene ${scene.cls}`} data-active={active ?? ''}>
              <BoatDrawing />
              {pins.map((z) => {
                const edge = z.x < 140 ? 'start' : z.x > 470 ? 'end' : 'mid';
                return (
                  <button
                    key={z.id}
                    type="button"
                    className={`bt-pin${active === z.id ? ' is-active' : ''}`}
                    data-edge={edge}
                    style={{ left: pct(z.x, 640), top: pct(z.y, 280) }}
                    aria-pressed={pin === z.id}
                    aria-label={tipFor(z.id)}
                    {...bind(z.id)}
                  >
                    <span className="bt-pin-dot" />
                    <span className="bt-tip" dir={rtl ? 'rtl' : 'ltr'}>{tipFor(z.id)}</span>
                  </button>
                );
              })}
            </div>
            {pins.length > 0 && (
              <p className="bt-hint">{t('Hover or tap the glowing dots to explore the boat.', 'مرّر المؤشر أو المس النقاط المضيئة لاستكشاف القارب.')}</p>
            )}

            {boat.specs.length > 0 && (
              <dl ref={tiles.ref} className={`bt-specs ${tiles.cls}`}>
                {boat.specs.map((s, i) => {
                  const Ic = pick(`${s.label.en} ${s.label.ar}`, specRules, Ship);
                  const zone = specZones[i];
                  const isCapacity = capacityRe.test(`${s.label.en} ${s.label.ar}`);
                  return (
                    <div
                      key={i}
                      className={`bt-tile bt-pop${zone && active === zone ? ' is-active' : ''}`}
                      style={{ '--i': i } as CSSProperties}
                      onPointerMove={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
                      }}
                      {...bind(zone)}
                    >
                      <span className="bt-tile-icon"><Ic aria-hidden="true" /></span>
                      <div className="bt-tile-body">
                        <dt>{s.label[lang]}</dt>
                        <dd><CountUp text={s.value[lang]} armed={tiles.armed} go={tiles.go} /></dd>
                        {isCapacity && <People text={`${s.value.en} ${s.value.ar}`} />}
                      </div>
                    </div>
                  );
                })}
              </dl>
            )}

            {boat.amenities.length > 0 && (
              <div ref={chips.ref} className={`bt-onboard ${chips.cls}`}>
                <h3>{t('On board', 'على متن القارب')}</h3>
                <ul className="bt-chips">
                  {boat.amenities.map((a, i) => {
                    const Ic = pick(`${a.en} ${a.ar}`, amenityRules, Check);
                    const zone = amenityZones[i];
                    return (
                      <li
                        key={i}
                        className={`bt-chip bt-pop${zone && active === zone ? ' is-active' : ''}`}
                        style={{ '--i': i, '--f': i % 4 } as CSSProperties}
                        tabIndex={zone ? 0 : undefined}
                        {...bind(zone)}
                      >
                        <span className="bt-chip-card">
                          <span className="bt-chip-icon"><Ic aria-hidden="true" /></span>
                          <span>{a[lang]}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
    </>
  );

  return embedded ? (
    <div className="detail-section boat-embedded" aria-labelledby="our-boat-title">{body}</div>
  ) : (
    <section className="section section-soft boat-section" aria-labelledby="our-boat-title">
      <div className="container">{body}</div>
    </section>
  );
}
