import { createFileRoute } from '@tanstack/react-router';
import { pageHead, bi } from '@/lib/content';
import { useLanguage, headLang } from '@/lib/language';
import { PageHeading } from '@/components/experience-components';
import { GroupTripsSection, PrivateTripsSection } from '@/components/trips-components';

export const Route = createFileRoute('/destinations/')({
  head: ({ matches }) =>
    pageHead(
      headLang(matches),
      bi('Group & Private Trips', 'الرحلات الجماعية والخاصة'),
      bi(
        'Plan a private trip around your interests or join a scheduled group trip in Oman with Earth Adventure.',
        'خطط لرحلة خاصة حسب اهتماماتك أو انضم إلى رحلة جماعية مجدولة في عُمان مع Earth Adventure.',
      ),
    ),
  component: Destinations,
});

// Destinations = the group trips first, then the private trips, shown together on one page.
function Destinations() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeading
        title={t('Group & Private Trips', 'الرحلات الجماعية والخاصة')}
        description={t(
          'Join a group trip on set dates, or plan your own private trip.',
          'انضم إلى رحلة جماعية في مواعيد محددة، أو خطط رحلتك الخاصة.',
        )}
        eyebrow={t('Destinations', 'الوجهات')}
      />
      <section className="section">
        <div className="container">
          <GroupTripsSection />
          <PrivateTripsSection />
        </div>
      </section>
    </>
  );
}
