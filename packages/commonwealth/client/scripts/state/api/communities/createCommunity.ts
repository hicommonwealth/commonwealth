import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { resetXPCacheForUser } from 'helpers/quest';
import { initAppState } from 'state';
import { trpc } from 'utils/trpcClient';
import useUserStore from '../../ui/user';

interface CreateCommunityProps {
  id: string;
  name: string;
  chainBase: ChainBase;
  chainNodeId: number;
  description: string;
  iconUrl: string;
  socialLinks: string[];
  tokenName?: string;
  turnstileToken?: string;
  tokenizeCommunity: boolean;
}

export const buildCreateCommunityInput = ({
  id,
  name,
  chainBase,
  description,
  iconUrl,
  socialLinks,
  tokenizeCommunity,
  tokenName,
  chainNodeId,
  turnstileToken,
}: CreateCommunityProps) => {
  const nameToSymbol = name.toUpperCase().slice(0, 4);
  return {
    id,
    name,
    base: chainBase,
    description,
    icon_url: iconUrl,
    social_links: socialLinks,
    type: ChainType.Offchain,
    default_symbol: nameToSymbol,
    token_name: tokenName,
    chain_node_id: chainNodeId,
    turnstile_token: turnstileToken,
    allow_tokenized_threads: tokenizeCommunity,
  };
};

const useCreateCommunityMutation = () => {
  const user = useUserStore();
  const utils = trpc.useUtils();
  return trpc.community.createCommunity.useMutation({
    onSuccess: async () => {
      user.setData({ addressSelectorSelectedAddress: undefined });

      resetXPCacheForUser(utils);

      await initAppState(false);
    },
  });
};

export default useCreateCommunityMutation;
