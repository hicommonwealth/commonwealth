import { trpc } from 'utils/trpcClient';

export function useRegisterClientRegistrationTokenMutation() {
  return trpc.subscriptions.registerClientRegistrationToken.useMutation();
}
