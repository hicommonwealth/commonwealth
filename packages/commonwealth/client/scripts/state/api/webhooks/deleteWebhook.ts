import { trpc } from 'utils/trpcClient';

const useDeleteWebhookMutation = () => {
  const utils = trpc.useUtils();
  return trpc.webhook.deleteWebhook.useMutation({
    onSuccess: async () => {
      await utils.webhook.getWebhooks.invalidate();
    },
  });
};

export default useDeleteWebhookMutation;
