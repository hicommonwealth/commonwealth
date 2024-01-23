import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Webhook from 'models/Webhook';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface CreateWebhookProps {
  communityId: string;
  webhookUrl: string;
}

const createWebhook = async ({
  communityId,
  webhookUrl,
}: CreateWebhookProps): Promise<Webhook> => {
  const response = await axios.post(`${app.serverUrl()}/createWebhook`, {
    chain: communityId,
    webhookUrl,
    auth: true,
    jwt: app.user.jwt,
  });

  const newWebhook = response.data.result;
  return new Webhook(
    newWebhook.id,
    newWebhook.url,
    newWebhook.categories,
    newWebhook.community_id,
  );
};

const useCreateWebhookMutation = () => {
  return useMutation({
    mutationFn: createWebhook,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.FETCH_WEBHOOKS, data.community_id],
      });
    },
  });
};

export default useCreateWebhookMutation;
