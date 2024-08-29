import { trpc } from 'utils/trpcClient';

const useEditWebhookMutation = () => {
  const utils = trpc.useUtils();
  return trpc.webhook.updateWebhook.useMutation({
    onSuccess: async () => {
      await utils.webhook.getWebhooks.invalidate();
    },
  });
};

export default useEditWebhookMutation;
