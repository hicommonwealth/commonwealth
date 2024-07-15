import { trpc } from 'utils/trpcClient';

export function useCommunityAlertsQuery() {
  return trpc.subscription.getCommunityAlerts.useQuery({});
}
