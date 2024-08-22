import axios from 'axios';
import Webhook from 'models/Webhook';
import { SERVER_URL } from 'state/api/config';
import { trpc } from 'utils/trpcClient';
import { userStore } from '../../ui/user';

interface CreateWebhookProps {
  communityId: string;
  webhookUrl: string;
}

const createWebhook = async ({
  communityId,
  webhookUrl,
}: CreateWebhookProps): Promise<Webhook> => {
  const response = await axios.post(`${SERVER_URL}/createWebhook`, {
    chain: communityId,
    webhookUrl,
    auth: true,
    jwt: userStore.getState().jwt,
  });

  const newWebhook = response.data.result;
  return new Webhook(
    newWebhook.id,
    newWebhook.url,
    newWebhook.categories,
    newWebhook.community_id,
  );
};

// const useCreateWebhookMutation = () => {
//   return useMutation({
//     mutationFn: createWebhook,
//     onSuccess: async (data) => {
//       await queryClient.invalidateQueries({
//         queryKey: [ApiEndpoints.FETCH_WEBHOOKS, data.community_id],
//       });
//     },
//   });
// };

const useCreateWebhookMutation = () => {
  const utils = trpc.useUtils();
  return trpc.webhook.createWebhook.useMutation({
    onSuccess: async () => {
      await utils.webhook.getWebhooks.invalidate();
    },
  });
};

export default useCreateWebhookMutation;
