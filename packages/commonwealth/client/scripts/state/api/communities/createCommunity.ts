import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { trpc } from 'client/scripts/utils/trpcClient';
import { initAppState } from 'state';
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
}

export const buildCreateCommunityInput = ({
  id,
  name,
  chainBase,
  description,
  iconUrl,
  socialLinks,
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
  };
};

const useCreateCommunityMutation = () => {
  const user = useUserStore();
  const utils = trpc.useUtils();
  return trpc.community.createCommunity.useMutation({
    onSuccess: async () => {
      user.setData({ addressSelectorSelectedAddress: undefined });

      // reset xp cache
      utils.quest.getQuests.invalidate().catch(console.error);
      utils.user.getXps.invalidate().catch(console.error);

      await initAppState(false);
    },
  });
};

export default useCreateCommunityMutation;
