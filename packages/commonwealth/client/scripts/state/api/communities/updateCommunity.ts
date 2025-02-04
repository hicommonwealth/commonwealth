import { ChainType, DefaultPage } from '@hicommonwealth/shared';
import { initAppState } from 'state';
import { trpc } from 'utils/trpcClient';
import useUserStore, { userStore } from '../../ui/user';
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
  defaultPage?: DefaultPage;
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
  defaultPage,
}: UpdateCommunityProps) => {
  return {
    jwt: userStore.getState().jwt,
    community_id: communityId,
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
    ...(typeof defaultPage !== 'undefined' && {
      default_page: defaultPage,
    }),
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
  const user = useUserStore();

  return trpc.community.updateCommunity.useMutation({
    onSuccess: async () => {
      // since this is the main chain/community object affecting
      // some other features, better to re-fetch on update.
      await invalidateAllQueriesForCommunity(communityId);

      user.setData({ addressSelectorSelectedAddress: undefined });

      if (reInitAppOnSuccess) {
        await initAppState(false);
      }
    },
  });
};

export default useUpdateCommunityMutation;
