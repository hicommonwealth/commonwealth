import { trpc } from 'utils/trpcClient';

export function useDeleteCommunityAlertMutation() {
  const utils = trpc.useUtils();
  return trpc.subscriptions.deleteCommunityAlert.useMutation({
    onSuccess: async () => {
      await utils.subscriptions.getCommunityAlerts.invalidate();
    },
  });
}
