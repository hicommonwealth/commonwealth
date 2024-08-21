import { trpc } from 'utils/trpcClient';

export function useCommunityAlertsQuery({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  return trpc.subscription.getCommunityAlerts.useQuery(
    {},
    {
      enabled,
      staleTime: 120_000,
    },
  );
}
