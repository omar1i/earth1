import { createFileRoute } from '@tanstack/react-router';
import { bi, pageHead } from '@/lib/content';
import { useLanguage, headLang } from '@/lib/language';
import { PageHeading } from '@/components/experience-components';
import { ReviewsCarousel, ReviewsSummary } from '@/components/reviews-section';
import { tripadvisor } from '@/lib/reviews';

export const Route = createFileRoute('/reviews')({
  head: ({ matches }) =>
    pageHead(
      headLang(matches),
      bi('Guest Reviews', 'تقييمات الضيوف'),
      bi(
        'Real words from guests who adventured with Earth Adventure across Oman, shared on Tripadvisor.',
        'كلمات حقيقية من ضيوف عاشوا مغامراتهم مع Earth Adventure في أنحاء عُمان، شاركوها على Tripadvisor.',
      ),
    ),
  component: Reviews,
});

function Reviews() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeading
        eyebrow={t('Guest stories', 'قصص ضيوفنا')}
        title={t('Reviews', 'التقييمات')}
        description={t('What our guests say about their adventures with us, in their own words.', 'ما يقوله ضيوفنا عن مغامراتهم معنا، بكلماتهم هم.')}
      />
      <section className="section">
        <div className="container">
          <div className="rvp-panel">
            <ReviewsSummary />
            <ReviewsCarousel />
          </div>
          <p className="rv-note">
            {t(
              `Reviews are shared by our guests on Tripadvisor, with their permission. Rating and ranking as of ${tripadvisor.asOf}.`,
              `التقييمات من ضيوفنا على Tripadvisor ونعرضها بإذنهم. التقييم والترتيب حتى ${tripadvisor.asOf}.`,
            )}
          </p>
        </div>
      </section>
    </>
  );
}
