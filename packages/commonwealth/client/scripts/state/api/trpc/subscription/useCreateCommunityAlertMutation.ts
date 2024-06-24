import { trpc } from 'utils/trpcClient';

export function useCreateCommunityAlertMutation() {
  return trpc.subscription.createCommunityAlert.useMutation();
}
