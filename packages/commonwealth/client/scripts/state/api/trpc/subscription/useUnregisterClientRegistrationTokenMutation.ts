import { trpc } from 'utils/trpcClient';

export function useUnregisterClientRegistrationTokenMutation() {
  return trpc.subscription.unregisterClientRegistrationToken.useMutation();
}
