import { trpc } from 'utils/trpcClient';

export function useDeleteApiKeyMutation() {
  const utils = trpc.useUtils();

  return trpc.user.deleteApiKey.useMutation({
    onSuccess: async () => {
      await utils.user.getApiKey.invalidate();
    },
  });
}
