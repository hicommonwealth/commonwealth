import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app, { initAppState } from 'state';
import { userStore } from '../../ui/user';

interface UpdateCommunityProps {
  communityId: string;
  namespace?: string;
  symbol?: string;
  transactionHash?: string;
  discordBotWebhooksEnabled?: boolean;
}

const updateCommunity = async ({
  communityId,
  namespace,
  symbol,
  transactionHash,
  discordBotWebhooksEnabled,
}: UpdateCommunityProps) => {
  return await axios.patch(`${app.serverUrl()}/communities/${communityId}`, {
    jwt: userStore.getState().jwt,
    id: communityId,
    ...(namespace && {
      namespace,
    }),
    ...(typeof symbol !== 'undefined' && {
      default_symbol: symbol,
    }),
    ...(typeof transactionHash !== 'undefined' && {
      transactionHash,
    }),
    ...(typeof discordBotWebhooksEnabled === 'boolean' && {
      discord_bot_webhooks_enabled: discordBotWebhooksEnabled,
    }),
  });
};

type UseUpdateCommunityMutationProps = {
  reInitAppOnSuccess?: boolean;
};

const useUpdateCommunityMutation = ({
  reInitAppOnSuccess,
}: UseUpdateCommunityMutationProps) => {
  return useMutation({
    mutationFn: updateCommunity,
    onSuccess: async () => {
      if (reInitAppOnSuccess) {
        await initAppState(false);
      }
    },
  });
};

export default useUpdateCommunityMutation;
