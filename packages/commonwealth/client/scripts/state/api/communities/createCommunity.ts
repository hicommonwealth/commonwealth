import { ChainBase, ChainType } from '@hicommonwealth/shared';
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
  tokenName?: string;
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
  };
};

const useCreateCommunityMutation = () => {
  return trpc.community.createCommunity.useMutation({
    onSuccess: async () => {
      await initAppState(false);
    },
  });
};

export default useCreateCommunityMutation;
