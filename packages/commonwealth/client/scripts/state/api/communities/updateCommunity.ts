import {
  ChainType,
  DefaultPage,
  DisabledCommunitySpamTier,
  UserTierMap,
} from '@hicommonwealth/shared';
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
  launchpadTokenImage?: string;
  defaultOverview?: boolean;
  chainNodeId?: string;
  type?: ChainType;
  defaultPage?: DefaultPage;
  aiFeaturesEnabled?: boolean;
  spamTierLevel?:
    | typeof DisabledCommunitySpamTier
    | UserTierMap.NewlyVerifiedWallet
    | UserTierMap.VerifiedWallet;
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
  launchpadTokenImage,
  defaultOverview,
  chainNodeId,
  type,
  defaultPage,
  aiFeaturesEnabled,
  spamTierLevel,
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
    ...(typeof launchpadTokenImage !== 'undefined' && {
      launchpad_token_image: launchpadTokenImage,
    }),
    ...(typeof defaultOverview !== 'undefined' && {
      default_summary_view: defaultOverview,
    }),
    ...(typeof chainNodeId !== 'undefined' && { chain_node_id: +chainNodeId }),
    ...(typeof type !== 'undefined' && { type: type }),
    ...(typeof defaultPage !== 'undefined' && {
      default_page: defaultPage,
    }),
    ...(typeof aiFeaturesEnabled !== 'undefined' && {
      ai_features_enabled: aiFeaturesEnabled,
    }),
    ...(typeof spamTierLevel !== 'undefined' && {
      spam_tier_level: spamTierLevel,
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
  const utils = trpc.useUtils();

  return trpc.community.updateCommunity.useMutation({
    onSuccess: async () => {
      // since this is the main chain/community object affecting
      // some other features, better to re-fetch on update.
      await invalidateAllQueriesForCommunity(communityId);

      await utils.launchpadToken.invalidate().catch(console.error);

      user.setData({ addressSelectorSelectedAddress: undefined });

      if (reInitAppOnSuccess) {
        await initAppState(false);
      }
    },
  });
};

export default useUpdateCommunityMutation;
