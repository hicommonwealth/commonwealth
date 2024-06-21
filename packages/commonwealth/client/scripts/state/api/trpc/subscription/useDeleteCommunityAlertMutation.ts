import { trpc } from 'utils/trpcClient';

export function useDeleteCommunityAlertMutation() {
  return trpc.subscription.deleteCommunityAlert.useMutation();
}
