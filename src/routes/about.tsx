import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, BedDouble, Eye, Plane, ShieldCheck, Target, Users, Wallet } from 'lucide-react';
import { images, pageHead, bi } from '@/lib/content';
import { resolveImage } from '@/lib/catalog';
import { aboutText } from '@/lib/about-content';
import { getSiteImages } from '@/lib/site-images.functions';
import { useLanguage, headLang, type Bilingual } from '@/lib/language';
import { Button } from '@/components/ui/button';
import { PageHeading, ValuesSection } from '@/components/experience-components';
import { PhotoFrame, PhotoGallery, Reveal } from '@/components/about-components';

export const Route = createFileRoute('/about')({
  head: ({ matches }) =>
    pageHead(
      headLang(matches),
      bi('About Earth Adventure', 'تعرّف على Earth Adventure'),
      bi(
        'Earth Adventure invites you to discover Oman through meaningful outdoor experiences, from the open sea to the desert and mountains.',
        'تدعوك Earth Adventure لاكتشاف عُمان من خلال تجارب طبيعية مميزة، من البحر المفتوح إلى الصحراء والجبال.',
      ),
    ),
  loader: () => getSiteImages(),
  component: About,
});

const pointIcons = { users: Users, bed: BedDouble, plane: Plane, shield: ShieldCheck, wallet: Wallet };

function About() {
  const { t, lang } = useLanguage();
  const pick = (b: Bilingual) => b[lang];
  const site = Route.useLoaderData();
  const purposeImg = resolveImage(site.purpose) ?? images.wadi;
  const companyImg = resolveImage(site.company);
  const visionImg = resolveImage(site.vision);
  const missionImg = resolveImage(site.mission);
  const whyImg = resolveImage(site.why);
  const founderImg = resolveImage(site.founder);
  const gallery = (site.gallery ?? []).map((g) => resolveImage(g)).filter((x): x is string => !!x);
  const A = aboutText;

  return (
    <>
      <PageHeading
        title={t('Earth Adventure', 'Earth Adventure')}
        eyebrow={t('A little closer to nature', 'أقرب إلى الطبيعة')}
        description={t(
          'An invitation to explore, to disconnect, and to discover the extraordinary outdoors of Oman.',
          'دعوة للاستكشاف والابتعاد عن الصخب واكتشاف روعة الطبيعة في عُمان.',
        )}
      />

      {/* Purpose */}
      <section className="section ea-section">
        <div className="container ea-split">
          <Reveal>
            <PhotoFrame src={purposeImg} alt={t('Natural pool and mountain landscape in Oman', 'بركة طبيعية ومناظر جبلية في عُمان')} />
          </Reveal>
          <Reveal delay={1}>
            <div className="eyebrow">{t('Our purpose', 'هدفنا')}</div>
            <h2>{t('Memories begin where the ordinary ends.', 'تبدأ الذكريات حيث ينتهي المألوف.')}</h2>
            <p>
              {t(
                'Earth Adventure invites you to discover Oman through meaningful outdoor experiences. From the open sea to the desert and mountains, our goal is to help people explore nature, create lasting memories, and experience the adventure of the outdoors.',
                'تدعوك Earth Adventure لاكتشاف عُمان من خلال تجارب هادفة في الهواء الطلق. من البحر المفتوح إلى الصحراء والجبال، هدفنا مساعدة الناس على استكشاف الطبيعة وصنع ذكريات تدوم والاستمتاع بروح المغامرة.',
              )}
            </p>
            <p>
              {t(
                'Whether you’re an Oman resident seeking a fresh escape or discovering Oman for the first time, your next adventure starts with what inspires you.',
                'سواء كنت مقيمًا في عُمان تبحث عن رحلة مختلفة أو تزور عُمان لأول مرة، تبدأ مغامرتك القادمة بما يلهمك.',
              )}
            </p>
            <Button asChild size="lg">
              <Link to="/book" search={{ experience: undefined }}>
                {t('Let’s plan your adventure', 'لنخطط لمغامرتك')}
                <ArrowUpRight />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* About the company */}
      <section className="section section-soft ea-section">
        <div className={`container ea-split${companyImg ? '' : ' ea-single'}`}>
          <Reveal>
            <div className="eyebrow">{pick(A.company.eyebrow)}</div>
            <h2>{pick(A.company.title)}</h2>
            {A.company.paragraphs.map((p, i) => (
              <p key={i}>{pick(p)}</p>
            ))}
            <div className="ea-facts">
              {A.company.facts.map((f, i) => (
                <div className="ea-fact" key={i}>
                  <b>{pick(f.value)}</b>
                  <span>{pick(f.label)}</span>
                </div>
              ))}
            </div>
          </Reveal>
          {companyImg && (
            <Reveal delay={1}>
              <PhotoFrame src={companyImg} alt={pick(A.company.title)} />
            </Reveal>
          )}
        </div>
      </section>

      {/* Vision and mission */}
      <section className="section ea-section">
        <div className="container ea-vm">
          {[
            { data: A.vision, img: visionImg, Icon: Eye },
            { data: A.mission, img: missionImg, Icon: Target },
          ].map(({ data, img, Icon }, i) => (
            <Reveal key={i} delay={i} className="ea-vm-card">
              {img && <PhotoFrame src={img} alt={pick(data.title)} ratio={1.6} />}
              <div className="ea-vm-body">
                <span className="ea-vm-icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3>{pick(data.title)}</h3>
                {data.paragraphs.map((p, j) => (
                  <p key={j}>{pick(p)}</p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="section section-soft ea-section">
        <div className={`container ea-split ea-flip${whyImg ? '' : ' ea-single'}`}>
          {whyImg && (
            <Reveal>
              <PhotoFrame src={whyImg} alt={pick(A.why.title)} ratio={0.95} />
            </Reveal>
          )}
          <Reveal delay={1}>
            <div className="eyebrow">{pick(A.why.eyebrow)}</div>
            <h2>{pick(A.why.title)}</h2>
            {A.why.paragraphs.map((p, i) => (
              <p key={i}>{pick(p)}</p>
            ))}
          </Reveal>
        </div>
        <div className="container">
          <div className="ea-points">
            {A.why.points.map((p, i) => {
              const Icon = pointIcons[p.icon as keyof typeof pointIcons];
              return (
                <Reveal key={i} delay={i} className="ea-point">
                  <Icon size={22} aria-hidden="true" />
                  <span>{pick(p.text)}</span>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Photo gallery (pictures chosen in the admin panel) */}
      {gallery.length > 0 && (
        <section className="section ea-section">
          <div className="container">
            <Reveal className="ea-center">
              <div className="eyebrow ea-eyebrow-center">{pick(A.gallery.eyebrow)}</div>
              <h2>{pick(A.gallery.title)}</h2>
            </Reveal>
            <PhotoGallery images={gallery} alt={pick(A.gallery.title)} />
          </div>
        </section>
      )}

      {/* Founder */}
      <section className="section section-soft ea-section">
        <div className="container ea-founder">
          <Reveal>
            {founderImg ? (
              <PhotoFrame src={founderImg} alt={pick(A.founder.name)} ratio={0.82} />
            ) : (
              <div className="ea-monogram" role="img" aria-label={pick(A.founder.name)}>
                {lang === 'ar' ? 'د' : 'D'}
              </div>
            )}
          </Reveal>
          <Reveal delay={1}>
            <div className="eyebrow">{pick(A.founder.eyebrow)}</div>
            <h2>{pick(A.founder.name)}</h2>
            <div className="ea-founder-meta">
              <span className="ea-chip">{pick(A.founder.role)}</span>
              <span className="ea-chip">{pick(A.founder.occupation)}</span>
            </div>
            <p className="ea-tagline">{pick(A.founder.tagline)}</p>
            {A.founder.paragraphs.map((p, i) => (
              <p key={i}>{pick(p)}</p>
            ))}
          </Reveal>
        </div>
      </section>

      <ValuesSection />
    </>
  );
}
