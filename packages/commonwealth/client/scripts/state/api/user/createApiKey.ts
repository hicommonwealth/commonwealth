import { trpc } from 'utils/trpcClient';

export function useCreateApiKeyMutation() {
  return trpc.user.createApiKey.useMutation();
}
