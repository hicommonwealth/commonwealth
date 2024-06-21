import { trpc } from 'utils/trpcClient';

export function useRegisterClientRegistrationTokenMutation() {
  return trpc.subscription.registerClientRegistrationToken.useMutation();
}
