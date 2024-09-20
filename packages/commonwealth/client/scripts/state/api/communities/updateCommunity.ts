import { ChainType } from '@hicommonwealth/shared';
import { trpc } from 'client/scripts/utils/trpcClient';
import { initAppState } from 'state';
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

export const buildUpdateCommunityInput = ({
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
}: UpdateCommunityProps) => {
  return {
    jwt: userStore.getState().jwt,
    id: communityId,
    ...(namespace && { namespace }),
    ...(typeof symbol !== 'undefined' && { default_symbol: symbol }),
    ...(typeof transactionHash !== 'undefined' && { transactionHash }),
    ...(typeof directoryPageEnabled === 'boolean' && {
      directory_page_enabled: directoryPageEnabled,
    }),
    ...(directoryPageChainNodeId && {
      directory_page_chain_node_id: directoryPageChainNodeId,
    }),
    ...(typeof snapshot !== 'undefined' && { snapshot }),
    ...(typeof snapshot !== 'undefined' && { snapshot }),
    ...(typeof terms !== 'undefined' && { terms }),
    ...(typeof discordBotWebhooksEnabled === 'boolean' && {
      discord_bot_webhooks_enabled: discordBotWebhooksEnabled,
    }),
    ...(typeof name !== 'undefined' && { name }),
    ...(typeof name !== 'undefined' && { name }),
    ...(typeof description !== 'undefined' && { description }),
    ...(typeof socialLinks !== 'undefined' && { social_links: socialLinks }),
    ...(typeof stagesEnabled !== 'undefined' && {
      stages_enabled: stagesEnabled,
    }),
    ...(typeof customStages !== 'undefined' && {
      custom_stages: customStages,
    }),
    ...(typeof customDomain !== 'undefined' && {
      custom_domain: customDomain,
    }),
    ...(typeof iconUrl !== 'undefined' && { icon_url: iconUrl }),
    ...(typeof defaultOverview !== 'undefined' && {
      default_summary_view: defaultOverview,
    }),
    ...(typeof chainNodeId !== 'undefined' && { chain_node_id: +chainNodeId }),
    ...(typeof type !== 'undefined' && { type: type }),
  };
};

type UseUpdateCommunityMutationProps = {
  communityId: string;
  reInitAppOnSuccess?: boolean;
};

const useUpdateCommunityMutation = ({
  communityId,
  reInitAppOnSuccess,
}: UseUpdateCommunityMutationProps) => {
  return trpc.community.updateCommunity.useMutation({
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
