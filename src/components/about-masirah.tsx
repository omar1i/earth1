import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Bird, Car, Fish, MessageCircle, Plane, Ship, Waves, Anchor } from 'lucide-react';
import { useLanguage } from '@/lib/language';
import { privateTripWhatsapp } from '@/lib/content';
import { Button } from '@/components/ui/button';

// "About Masirah" section for the Masirah fishing trip page.
// Everything on screen is written here (English + Arabic). To change a text, edit it below.

// Links in "How to get to Masirah". Leave a link as '' to show the text without a link.
const FERRY_BOOKING_URL = ''; // put the National Ferries Company booking page here once you have checked it
const FLIGHT_BOOKING_URL = 'https://www.salamair.com';

// Months run January (0) to December (11).
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const FISHING_BEST = [9, 10, 11, 0, 1, 2, 3, 4]; // fishing season: 1 October to the end of May (no trips June - September)
const WINDY = [3, 4, 5, 6, 7, 8]; // Apr - Sep

// Plays the route drawing once, when it scrolls into view. Without JavaScript, or with reduced motion, it is simply shown.
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [armed, setArmed] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    setArmed(true);
    if (el.getBoundingClientRect().top < window.innerHeight * 0.8) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, cls: `${armed ? 'is-armed' : ''} ${on ? 'is-on' : ''}` };
}

type FishKind = 'tuna' | 'kingfish' | 'grouper' | 'reef';

// Simple flat fish drawings in the site's blue, one shape per kind of fish.
function FishArt({ kind }: { kind: FishKind }) {
  const shapes: Record<FishKind, { body: string; tail: string; fin: string; belly: string; eye: [number, number]; extra?: string }> = {
    tuna: {
      body: 'M10 32 C30 8 78 8 100 32 C78 56 30 56 10 32Z',
      tail: 'M98 32 L124 12 L116 32 L124 52Z',
      fin: 'M54 14 L62 3 L70 15Z',
      belly: 'M16 36 C38 50 76 50 98 36 C78 56 30 56 16 36Z',
      eye: [28, 30],
      extra: 'M72 22 L76 18 M78 24 L82 20',
    },
    kingfish: {
      body: 'M8 32 C34 19 82 19 104 32 C82 45 34 45 8 32Z',
      tail: 'M102 32 L126 16 L118 32 L126 48Z',
      fin: 'M48 22 L56 12 L64 22Z',
      belly: 'M14 35 C40 44 80 44 102 35 C82 45 34 45 14 35Z',
      eye: [24, 30],
      extra: 'M84 24 L88 21 M90 26 L94 23',
    },
    grouper: {
      body: 'M16 32 C20 8 74 4 98 26 C104 31 104 33 98 38 C74 60 20 56 16 32Z',
      tail: 'M100 32 L120 20 L116 32 L120 44Z',
      fin: 'M46 10 L58 2 L70 10Z',
      belly: 'M22 38 C44 52 78 52 98 38 C74 60 20 56 22 38Z',
      eye: [32, 26],
      extra: 'M14 34 C18 38 24 38 28 36',
    },
    reef: {
      body: 'M26 32 C30 6 78 6 94 32 C78 58 30 58 26 32Z',
      tail: 'M92 32 L116 16 L110 32 L116 48Z',
      fin: 'M48 10 L60 -1 L72 11Z',
      belly: 'M32 38 C48 52 78 52 92 36 C78 58 30 58 32 38Z',
      eye: [40, 28],
      extra: 'M58 14 C54 26 54 38 58 50 M72 14 C68 26 68 38 72 50',
    },
  };
  const s = shapes[kind];
  return (
    <svg className="am-fish-art" viewBox="0 0 130 64" aria-hidden="true" focusable="false">
      <path d={s.fin} className="am-fish-fin" />
      <path d={s.tail} className="am-fish-tail" />
      <path d={s.body} className="am-fish-body" />
      <path d={s.belly} className="am-fish-belly" />
      {s.extra && <path d={s.extra} className="am-fish-line" />}
      <circle cx={s.eye[0]} cy={s.eye[1]} r="3.6" className="am-fish-eye" />
      <circle cx={s.eye[0] + 0.7} cy={s.eye[1]} r="1.6" className="am-fish-pupil" />
    </svg>
  );
}

// photos: real fish photos chosen in the admin panel (About page tab). A fish without a photo shows its drawing.
export function AboutMasirah({ tripId, tripName, photos = {} }: { tripId: string; tripName: string; photos?: Partial<Record<FishKind, string>> }) {
  const { lang, t } = useLanguage();
  const months = lang === 'ar' ? MONTHS_AR : MONTHS_EN;
  const route = useReveal<HTMLDivElement>();
  // Highlights the current month once the page is in the browser (not on the server, so the page never mismatches).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(new Date().getMonth()), []);

  const reasons = [
    {
      Icon: Anchor,
      title: t("Oman's largest island", 'أكبر جزر عُمان'),
      text: t('About 95 km of coast in the Arabian Sea, from white sand beaches to rocky headlands.', 'نحو 95 كيلومترًا من الساحل في بحر العرب، بين شواطئ رملية بيضاء ورؤوس صخرية.'),
    },
    {
      Icon: Fish,
      title: t('A real fishing community', 'مجتمع صيد حقيقي'),
      text: t("Most of the island's roughly 12,000 people come from fishing families, and fishing is part of everyday life here.", 'معظم سكان الجزيرة، ونحو 12 ألفًا، من أسر الصيادين، والصيد جزء من الحياة اليومية هنا.'),
    },
    {
      Icon: Waves,
      title: t('Quiet and unspoiled', 'هادئة وبكر'),
      text: t('Long empty beaches, a slow pace and none of the crowds of the mainland.', 'شواطئ طويلة خالية، وإيقاع هادئ، وبعيدة عن زحام البر.'),
    },
    {
      Icon: Bird,
      title: t('Turtles and birds', 'سلاحف وطيور'),
      text: t("Home to the world's largest known nesting population of loggerhead turtles, and more than 300 bird species.", 'موطن أكبر تجمع معروف لتعشيش السلاحف ضخمة الرأس في العالم، وأكثر من 300 نوع من الطيور.'),
    },
  ];

  const fish: { kind: FishKind; name: string; alt: string; text: string; note?: string }[] = [
    {
      kind: 'tuna',
      name: t('Tuna', 'التونة'),
      alt: t('Tuna caught on a fishing trip in Masirah Island, Oman', 'تونة من رحلة صيد في جزيرة مصيرة، عُمان'),
      text: t('Fast and powerful, and the main target on many deep-sea trips.', 'سريعة وقوية، وهدف رئيسي في كثير من رحلات عرض البحر.'),
      note: t('Season starts from the beginning of February', 'يبدأ الموسم من أول فبراير'),
    },
    {
      kind: 'kingfish',
      name: t('Kingfish', 'الكنعد'),
      alt: t('Kingfish caught on a fishing trip in Masirah Island, Oman', 'كنعد من رحلة صيد في جزيرة مصيرة، عُمان'),
      text: t("A strong, fast fish and a regular in the local fishermen's catch.", 'سمكة قوية وسريعة، ومن الأسماك المعتادة في صيد أهل الجزيرة.'),
    },
    {
      kind: 'grouper',
      name: t('Grouper', 'الهامور'),
      alt: t('Grouper caught on a fishing trip in Masirah Island, Oman', 'هامور من رحلة صيد في جزيرة مصيرة، عُمان'),
      text: t('A powerful bottom fish, found around reefs and rocky ground.', 'سمكة قاع قوية، تعيش قرب الشعاب والأرض الصخرية.'),
    },
    {
      kind: 'reef',
      name: t('Reef fish', 'أسماك الشعاب'),
      alt: t('Reef fish caught on a fishing trip in Masirah Island, Oman', 'سمكة من أسماك الشعاب من رحلة صيد في جزيرة مصيرة، عُمان'),
      text: t("Many reef species live in the island's waters and add variety to a day's catch.", 'تعيش أنواع كثيرة من أسماك الشعاب في مياه الجزيرة، وتضيف تنوعًا إلى صيد اليوم.'),
    },
  ];

  const linkFor = (url: string, label: string) =>
    url ? (
      <a className="text-link" href={url} target="_blank" rel="noreferrer">
        {label}
        <ArrowUpRight />
      </a>
    ) : null;

  return (
    <section className="section section-soft about-masirah" id="about-masirah" aria-labelledby="about-masirah-title">
      <div className="container">
        <header className="am-head">
          <h2 id="about-masirah-title">{t('About Masirah Island', 'عن جزيرة مصيرة')}</h2>
          <p>
            {t(
              'Masirah sits out in the Arabian Sea, and its waters are counted among the most productive fishing grounds in the region. If you are planning a fishing trip in Masirah, this is what to know before you come.',
              'تقع مصيرة في عرض بحر العرب، وتُعد مياهها من أغنى مناطق الصيد في المنطقة. وإذا كنت تخطط لرحلة صيد في مصيرة، فهذا ما تحتاج إلى معرفته قبل أن تأتي.',
            )}
          </p>
        </header>

        {/* 1. Why Masirah? */}
        <div className="am-block">
          <h3>{t('Why Masirah?', 'لماذا مصيرة؟')}</h3>
          <ul className="am-reasons">
            {reasons.map(({ Icon, title, text }) => (
              <li key={title} className="am-reason">
                <span className="boat-icon"><Icon aria-hidden="true" /></span>
                <div>
                  <h4>{title}</h4>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. How to get there */}
        <div className="am-block">
          <h3>{t('How to get to Masirah', 'كيف تصل إلى مصيرة؟')}</h3>
          <div
            ref={route.ref}
            className={`am-route ${route.cls}`}
            role="img"
            aria-label={t(
              'Route: from Muscat by road to Shannah Port, then by ferry to Hilf on Masirah. About 5 hours in total, ferry included.',
              'خط الرحلة: من مسقط بالسيارة إلى ميناء شنة، ثم بالعبّارة إلى حلف في مصيرة. نحو 5 ساعات في المجمل شاملة العبّارة.',
            )}
          >
            <div className="am-stop">
              <span className="am-dot" />
              <strong>{t('Muscat', 'مسقط')}</strong>
            </div>
            <div className="am-leg">
              <span className="am-leg-label"><Car aria-hidden="true" />{t('By road', 'بالسيارة')}</span>
            </div>
            <div className="am-stop">
              <span className="am-dot" />
              <strong>{t('Shannah Port', 'ميناء شنة')}</strong>
            </div>
            <div className="am-leg am-leg-sea">
              <span className="am-leg-label"><Ship aria-hidden="true" />{t('Ferry, 1 to 2 hours', 'عبّارة، من ساعة إلى ساعتين')}</span>
            </div>
            <div className="am-stop am-stop-end">
              <span className="am-dot" />
              <strong>{t('Hilf, Masirah', 'حلف، مصيرة')}</strong>
            </div>
          </div>
          <p className="am-route-note">
            {t('About 5 hours from Muscat in total, ferry included. Prefer to fly? The flight takes about an hour.', 'نحو 5 ساعات من مسقط في المجمل شاملة العبّارة. وإن فضلت الطيران فالرحلة نحو ساعة.')}
          </p>

          <div className="am-ways">
            <article className="am-way">
              <span className="boat-icon"><Ship aria-hidden="true" /></span>
              <h4>{t('By road and ferry', 'بالسيارة والعبّارة')}</h4>
              <p>{t('Drive from Muscat to Shannah Port, then take the National Ferries Company (NFC) ferry to Hilf.', 'قُد من مسقط إلى ميناء شنة، ثم اركب عبّارة الشركة الوطنية للعبّارات (NFC) إلى حلف.')}</p>
              <p>{t('There are only a few sailings a day, so book ahead.', 'عدد الرحلات اليومية قليل، فاحجز مسبقًا.')}</p>
              <p>{t('As a guide, fares are about OMR 3 per passenger, OMR 16 for a car and OMR 20 for a 4WD, each way. Check the current fares when you book.', 'للاسترشاد، الأسعار نحو 3 ريالات للراكب، و16 ريالًا للسيارة، و20 ريالًا للدفع الرباعي، في الاتجاه الواحد. تأكد من الأسعار الحالية عند الحجز.')}</p>
              {linkFor(FERRY_BOOKING_URL, t('Book the ferry', 'احجز العبّارة'))}
            </article>
            <article className="am-way">
              <span className="boat-icon"><Plane aria-hidden="true" /></span>
              <h4>{t('By air', 'بالطائرة')}</h4>
              <p>{t('Salam Air flies non-stop from Muscat (MCT) to Masirah (MSH) in about an hour.', 'تسير طيران السلام رحلة مباشرة من مسقط (MCT) إلى مصيرة (MSH) في نحو ساعة.')}</p>
              <p>{t('Flights run only a few days a week and the days change, so check the schedule before you plan.', 'الرحلات في أيام قليلة من الأسبوع والأيام تتغير، فتأكد من الجدول قبل أن تخطط.')}</p>
              {linkFor(FLIGHT_BOOKING_URL, t('Check flights on Salam Air', 'تحقق من الرحلات على طيران السلام'))}
            </article>
            <article className="am-way">
              <span className="boat-icon"><Car aria-hidden="true" /></span>
              <h4>{t('Getting around', 'التنقل في الجزيرة')}</h4>
              <p>{t("Hilf is the island's only town, at its northern end. Most visitors bring their own car across on the ferry.", 'حلف هي البلدة الوحيدة في الجزيرة، عند طرفها الشمالي. ويعبر معظم الزوار بسياراتهم على العبّارة.')}</p>
            </article>
          </div>
          <p className="notice am-tip">
            {t(
              "Arrive the day before. The trip starts in the morning, and ferry and flight times are limited. Getting to Masirah is not included in the trip price, so message us on WhatsApp if you would like help planning it.",
              'يُفضل أن تصل قبل الرحلة بيوم. الرحلة تبدأ في الصباح، ومواعيد العبّارة والطيران محدودة. الوصول إلى مصيرة غير مشمول في سعر الرحلة، فراسلنا على واتساب إذا أردت مساعدة في ترتيبه.',
            )}
          </p>
        </div>

        {/* 3. Best time */}
        <div className="am-block">
          <h3>{t('Best time to fish in Masirah', 'أفضل وقت للصيد في مصيرة')}</h3>
          <div className="am-season">
            <ol className="am-months" aria-hidden="true">
              {months.map((name, i) => (
                <li key={i} className={`am-month${now === i ? ' is-now' : ''}`}>
                  <span className="am-month-name">{name}</span>
                  <span className={`am-bar am-bar-fish${FISHING_BEST.includes(i) ? ' best' : ''}`} />
                  <span className={`am-bar am-bar-wind${WINDY.includes(i) ? ' on' : ''}`} />
                </li>
              ))}
            </ol>
            <ul className="am-legend">
              <li><span className="am-swatch am-swatch-best" />{t('Fishing season: October to May', 'موسم الصيد: من أكتوبر إلى مايو')}</li>
              <li><span className="am-swatch am-swatch-wind" />{t('Strong, steady winds: April to September', 'رياح قوية وثابتة: من أبريل إلى سبتمبر')}</li>
              {now !== null && <li><span className="am-swatch am-swatch-now" />{t('This month', 'هذا الشهر')}</li>}
            </ul>
            <p className="am-season-note">
              {t(
                'Our fishing season starts on 1 October and runs until the end of May. There are no fishing trips from June to September. The sea still decides each day, so tell us your dates and we will tell you honestly what to expect.',
                'يبدأ موسم الصيد لدينا من أول أكتوبر ويستمر حتى نهاية مايو. ولا توجد رحلات صيد من يونيو إلى سبتمبر. والبحر هو من يقرر كل يوم، فأخبرنا بتواريخك ونخبرك بصراحة بما تتوقعه.',
              )}
            </p>
          </div>
        </div>

        {/* 4. Fish */}
        <div className="am-block">
          <h3>{t('What you can catch in Masirah', 'ما الأسماك التي يمكن صيدها في مصيرة؟')}</h3>
          <ul className={`am-fish-grid${fish.some((f) => photos[f.kind]) ? ' with-photos' : ''}`}>
            {fish.map((f) => (
              <li key={f.kind} className="am-fish-card">
                <div className={`am-fish-stage${photos[f.kind] ? ' has-photo' : ''}`}>
                  {photos[f.kind] ? <img className="am-fish-photo" src={photos[f.kind]} alt={f.alt} loading="lazy" decoding="async" /> : <FishArt kind={f.kind} />}
                </div>
                <div className="am-fish-body-text">
                  <h4>{f.name}</h4>
                  <p>{f.text}</p>
                  {f.note && <span className="am-fish-note">{f.note}</span>}
                </div>
              </li>
            ))}
          </ul>
          <p className="am-season-note">
            {t(
              "What bites depends on the season, the weather and the sea, so we cannot promise a catch. We head for the best spots for your dates.",
              'ما يعلق بالصنارة يعتمد على الموسم والطقس والبحر، لذلك لا نستطيع وعدك بصيد. نتجه إلى أنسب الأماكن في موعدك.',
            )}
          </p>
        </div>

        {/* Closing call to action */}
        <div className="am-cta">
          <div>
            <h3>{t('Planning a fishing trip in Masirah?', 'تخطط لرحلة صيد في مصيرة؟')}</h3>
            <p>{t('Send us your dates and group size, and we will plan the day around you.', 'أرسل لنا تواريخك وعدد مجموعتك، ونرتب اليوم على حسب رغبتك.')}</p>
          </div>
          <div className="am-cta-actions">
            <Button asChild size="lg" className="book-btn">
              <Link to="/book" search={{ experience: tripId }}>
                {t('Book Now', 'احجز الآن')}
                <ArrowUpRight size={17} />
              </Link>
            </Button>
            <a className="text-link" href={privateTripWhatsapp(tripName)} target="_blank" rel="noreferrer">
              <MessageCircle />
              {t('Ask us on WhatsApp', 'اسألنا عبر واتساب')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
