import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { linkExistingAddressToChainOrCommunity } from 'client/scripts/controllers/app/login';
import { trpc } from 'client/scripts/utils/trpcClient';
import { initAppState } from 'state';

interface CreateCommunityProps {
  id: string;
  name: string;
  chainBase: ChainBase;
  chainNodeId: number;
  description: string;
  iconUrl: string;
  socialLinks: string[];
  userAddress: string;
  isPWA?: boolean;
  tokenName?: string;
}

export const buildCreateCommunityInput = ({
  id,
  name,
  chainBase,
  description,
  iconUrl,
  socialLinks,
  userAddress,
  tokenName,
  chainNodeId,
}: CreateCommunityProps) => {
  const nameToSymbol = name.toUpperCase().slice(0, 4);
  return {
    id,
    name,
    base: chainBase,
    description,
    icon_url: iconUrl,
    social_links: socialLinks,
    user_address: userAddress,
    type: ChainType.Offchain,
    default_symbol: nameToSymbol,
    token_name: tokenName,
    chain_node_id: chainNodeId,
  };
};

const useCreateCommunityMutation = () => {
  return trpc.community.createCommunity.useMutation({
    onSuccess: async (output) => {
      if (output.admin_address) {
        await linkExistingAddressToChainOrCommunity(
          output.admin_address,
          output.community.id,
          output.community.id,
        );
      }
      await initAppState(false);
    },
  });
};

export default useCreateCommunityMutation;
