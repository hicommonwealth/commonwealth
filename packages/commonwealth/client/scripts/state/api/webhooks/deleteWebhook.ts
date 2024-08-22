import axios from 'axios';
import { SERVER_URL } from 'state/api/config';
import { trpc } from 'utils/trpcClient';
import { userStore } from '../../ui/user';

interface DeleteWebhookProps {
  communityId: string;
  webhookUrl: string;
}

const deleteWebhook = async ({
  webhookUrl,
  communityId,
}: DeleteWebhookProps) => {
  await axios.post(`${SERVER_URL}/deleteWebhook`, {
    chain: communityId,
    webhookUrl,
    auth: true,
    jwt: userStore.getState().jwt,
  });
};

// const useDeleteWebhookMutation = () => {
//   return useMutation({
//     mutationFn: deleteWebhook,
//     onSuccess: async (data, variables) => {
//       await queryClient.invalidateQueries({
//         queryKey: [ApiEndpoints.FETCH_WEBHOOKS, variables.communityId],
//       });
//     },
//   });
// };

const useDeleteWebhookMutation = () => {
  const utils = trpc.useUtils();
  return trpc.webhook.deleteWebhook.useMutation({
    onSuccess: async () => {
      await utils.webhook.getWebhooks.invalidate();
    },
  });
};

export default useDeleteWebhookMutation;
