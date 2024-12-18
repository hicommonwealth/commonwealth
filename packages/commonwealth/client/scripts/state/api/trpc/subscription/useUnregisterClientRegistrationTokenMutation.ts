import { trpc } from 'utils/trpcClient';

export function useUnregisterClientRegistrationTokenMutation() {
  return trpc.subscriptions.unregisterClientRegistrationToken.useMutation();
}
