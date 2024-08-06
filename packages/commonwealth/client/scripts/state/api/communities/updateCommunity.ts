import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app, { initAppState } from 'state';
import { userStore } from '../../ui/user';

interface UpdateCommunityProps {
  communityId: string;
  namespace?: string;
  symbol?: string;
  transactionHash?: string;
  directoryPageEnabled?: boolean;
  directoryPageChainNodeId?: number;
  discordBotWebhooksEnabled?: boolean;
  snapshot?: string[];
  terms?: string;
  isPWA?: boolean;
}

const updateCommunity = async ({
  communityId,
  namespace,
  symbol,
  transactionHash,
  directoryPageEnabled,
  directoryPageChainNodeId,
  discordBotWebhooksEnabled,
  snapshot,
  terms,
  isPWA,
}: UpdateCommunityProps) => {
  return await axios.patch(
    `${app.serverUrl()}/communities/${communityId}`,
    {
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
      ...(typeof directoryPageEnabled === 'boolean' && {
        directory_page_enabled: directoryPageEnabled,
      }),
      ...(directoryPageChainNodeId && {
        directory_page_chain_node_id: directoryPageChainNodeId,
      }),
      ...(typeof snapshot !== 'undefined' && {
        snapshot,
      }),
      ...(typeof snapshot !== 'undefined' && {
        snapshot,
      }),
      ...(typeof terms !== 'undefined' && {
        terms,
      }),
      ...(typeof discordBotWebhooksEnabled === 'boolean' && {
        discord_bot_webhooks_enabled: discordBotWebhooksEnabled,
      }),
    },
    {
      headers: {
        isPWA: isPWA?.toString(),
      },
    },
  );
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
