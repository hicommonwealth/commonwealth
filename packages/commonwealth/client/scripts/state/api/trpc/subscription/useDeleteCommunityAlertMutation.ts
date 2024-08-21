import { queryClient } from 'state/api/config';
import { trpc } from 'utils/trpcClient';

export function useDeleteCommunityAlertMutation() {
  return trpc.subscription.deleteCommunityAlert.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.subscription.getCommunityAlerts.getQueryKey({}),
      });
    },
  });
}
