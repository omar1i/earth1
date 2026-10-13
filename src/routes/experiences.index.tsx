import { createFileRoute, redirect } from '@tanstack/react-router';

// The separate Experiences page was removed: old links to /experiences now land on Destinations,
// which shows the private and group trips together.
export const Route = createFileRoute('/experiences/')({
  beforeLoad: () => {
    throw redirect({ to: '/destinations' });
  },
});
