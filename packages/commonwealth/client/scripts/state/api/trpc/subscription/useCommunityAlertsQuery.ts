import { trpc } from 'utils/trpcClient';

export function useCommunityAlertsQuery({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  return trpc.subscriptions.getCommunityAlerts.useQuery(
    {},
    {
      enabled,
      staleTime: Infinity,
    },
  );
}
