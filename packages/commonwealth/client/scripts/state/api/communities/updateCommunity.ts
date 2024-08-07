import { ChainType } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app, { initAppState } from 'state';
import { userStore } from '../../ui/user';
import { invalidateAllQueriesForCommunity } from './getCommuityById';

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
  name?: string;
  description?: string;
  socialLinks?: string[];
  stagesEnabled?: boolean;
  customStages?: string[];
  customDomain?: string;
  iconUrl?: string;
  defaultOverview?: boolean;
  chainNodeId?: string;
  type?: ChainType;
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
  name,
  description,
  socialLinks,
  stagesEnabled,
  customStages,
  customDomain,
  iconUrl,
  defaultOverview,
  chainNodeId,
  type,
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
      ...(typeof name !== 'undefined' && {
        name,
      }),
      ...(typeof name !== 'undefined' && {
        name,
      }),
      ...(typeof description !== 'undefined' && {
        description,
      }),
      ...(typeof socialLinks !== 'undefined' && {
        social_links: socialLinks,
      }),
      ...(typeof stagesEnabled !== 'undefined' && {
        stages_enabled: stagesEnabled,
      }),
      ...(typeof customStages !== 'undefined' && {
        custom_stages: customStages,
      }),
      ...(typeof customDomain !== 'undefined' && {
        custom_domain: customDomain,
      }),
      ...(typeof iconUrl !== 'undefined' && {
        icon_url: iconUrl,
      }),
      ...(typeof defaultOverview !== 'undefined' && {
        default_summary_view: defaultOverview,
      }),
      ...(typeof chainNodeId !== 'undefined' && {
        chain_node_id: chainNodeId,
      }),
      ...(typeof type !== 'undefined' && {
        type: type,
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
  communityId: string;
  reInitAppOnSuccess?: boolean;
};

const useUpdateCommunityMutation = ({
  communityId,
  reInitAppOnSuccess,
}: UseUpdateCommunityMutationProps) => {
  return useMutation({
    mutationFn: updateCommunity,
    onSuccess: async () => {
      // since this is the main chain/community object affecting
      // some other features, better to re-fetch on update.
      await invalidateAllQueriesForCommunity(communityId);

      if (reInitAppOnSuccess) {
        await initAppState(false);
      }
    },
  });
};

export default useUpdateCommunityMutation;
