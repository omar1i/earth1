import { createFileRoute } from '@tanstack/react-router';
import { pageHead, bi } from '@/lib/content';
import { useLanguage, headLang } from '@/lib/language';
import { PageHeading } from '@/components/experience-components';
import { GroupTripsSection, PrivateTripsSection } from '@/components/trips-components';

export const Route = createFileRoute('/destinations/')({
  head: ({ matches }) =>
    pageHead(
      headLang(matches),
      bi('Private & Group Trips', 'الرحلات الخاصة والجماعية'),
      bi(
        'Plan a private trip around your interests or join a scheduled group trip in Oman with Earth Adventure.',
        'خطط لرحلة خاصة حسب اهتماماتك أو انضم إلى رحلة جماعية مجدولة في عُمان مع Earth Adventure.',
      ),
    ),
  component: Destinations,
});

// Destinations = the private trips and the group trips, shown together on one page.
function Destinations() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeading
        title={t('Private & Group Trips', 'الرحلات الخاصة والجماعية')}
        description={t(
          'Plan your own private trip, or join a group trip on set dates.',
          'خطط رحلتك الخاصة، أو انضم إلى رحلة جماعية في مواعيد محددة.',
        )}
        eyebrow={t('Destinations', 'الوجهات')}
      />
      <section className="section">
        <div className="container">
          <PrivateTripsSection />
          <GroupTripsSection />
        </div>
      </section>
    </>
  );
}
