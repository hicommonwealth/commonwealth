import { trpc } from 'utils/trpcClient';

const useCreateWebhookMutation = () => {
  const utils = trpc.useUtils();
  return trpc.webhook.createWebhook.useMutation({
    onSuccess: async () => {
      await utils.webhook.getWebhooks.invalidate();
    },
  });
};

export default useCreateWebhookMutation;
