import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface DeleteWebhookProps {
  communityId: string;
  webhookUrl: string;
}

const deleteWebhook = async ({
  webhookUrl,
  communityId,
}: DeleteWebhookProps) => {
  await axios.post(`${app.serverUrl()}/deleteWebhook`, {
    chain: communityId,
    webhookUrl,
    auth: true,
    jwt: app.user.jwt,
  });
};

const useDeleteWebhookMutation = () => {
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.FETCH_WEBHOOKS, variables.communityId],
      });
    },
  });
};

export default useDeleteWebhookMutation;
