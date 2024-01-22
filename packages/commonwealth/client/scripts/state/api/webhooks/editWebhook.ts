import { WebhookCategory } from '@hicommonwealth/core';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Webhook from 'models/Webhook';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface EditWebhookProps {
  communityId: string;
  webhookId?: number;
  webhookCategories: WebhookCategory[];
}

const editWebhook = async ({
  communityId,
  webhookId,
  webhookCategories,
}: EditWebhookProps): Promise<Webhook> => {
  const response = await axios.post(`${app.serverUrl()}/updateWebhook`, {
    chain: communityId,
    webhookId,
    categories: webhookCategories,
    jwt: app.user.jwt,
  });

  const updatedWebhook = response.data.result;
  return new Webhook(
    updatedWebhook.id,
    updatedWebhook.url,
    updatedWebhook.categories,
    updatedWebhook.community_id,
  );
};

const useEditWebhookMutation = () => {
  return useMutation({
    mutationFn: editWebhook,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.FETCH_WEBHOOKS, variables.communityId],
      });
    },
  });
};

export default useEditWebhookMutation;
