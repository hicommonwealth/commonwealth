import { trpc } from 'utils/trpcClient';

export function useCreateCommunityAlertMutation() {
  const utils = trpc.useUtils();
  return trpc.subscription.createCommunityAlert.useMutation({
    onSuccess: async () => {
      await utils.subscription.getCommunityAlerts.invalidate();
    },
  });
}
