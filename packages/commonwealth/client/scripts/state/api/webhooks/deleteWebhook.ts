import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, SERVER_URL, queryClient } from 'state/api/config';
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
