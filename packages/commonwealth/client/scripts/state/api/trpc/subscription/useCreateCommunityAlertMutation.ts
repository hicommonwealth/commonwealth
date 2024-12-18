import { trpc } from 'utils/trpcClient';

export function useCreateCommunityAlertMutation() {
  const utils = trpc.useUtils();
  return trpc.subscriptions.createCommunityAlert.useMutation({
    onSuccess: async () => {
      await utils.subscriptions.getCommunityAlerts.invalidate();
    },
  });
}
