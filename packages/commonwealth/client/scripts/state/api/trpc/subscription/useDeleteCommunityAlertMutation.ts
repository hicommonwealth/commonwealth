import { trpc } from 'utils/trpcClient';

export function useDeleteCommunityAlertMutation() {
  const utils = trpc.useUtils();
  return trpc.subscription.deleteCommunityAlert.useMutation({
    onSuccess: async () => {
      await utils.subscription.getCommunityAlerts.invalidate();
    },
  });
}
