import { queryClient } from 'state/api/config';
import { trpc } from 'utils/trpcClient';

export function useCreateCommunityAlertMutation() {
  return trpc.subscription.createCommunityAlert.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.subscription.getCommunityAlerts.getQueryKey({}),
      });
    },
  });
}
