import { trpc } from 'utils/trpcClient';

/**
 * @deprecated TODO this is ALREADY deprecated because this is a workaround to
 * fix the problem with dates as strings and types being wrong. We need to fix
 * this once we fix types on the client.
 */
export function useCommunityAlerts() {
  const communityAlerts = trpc.subscription.getCommunityAlerts.useQuery({});

  return communityAlerts;
}
