import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { linkExistingAddressToChainOrCommunity } from 'client/scripts/controllers/app/login';
import { trpc } from 'client/scripts/utils/trpcClient';
import { baseToNetwork } from 'helpers';
import { initAppState } from 'state';

interface CreateCommunityProps {
  id: string;
  name: string;
  chainBase: ChainBase;
  ethChainId?: string;
  cosmosChainId?: string;
  description: string;
  iconUrl: string;
  socialLinks: string[];
  nodeUrl: string;
  altWalletUrl: string;
  userAddress: string;
  bech32Prefix?: string;
  isPWA?: boolean;
  tokenName?: string;
}

export const buildCreateCommunityInput = ({
  id,
  name,
  chainBase,
  ethChainId,
  cosmosChainId,
  description,
  iconUrl,
  socialLinks,
  nodeUrl,
  altWalletUrl,
  userAddress,
  bech32Prefix,
  tokenName,
}: CreateCommunityProps) => {
  const nameToSymbol = name.toUpperCase().slice(0, 4);
  const communityNetwork =
    chainBase === ChainBase.CosmosSDK
      ? cosmosChainId
      : baseToNetwork(chainBase);
  return {
    id,
    name,
    base: chainBase,
    description,
    icon_url: iconUrl,
    social_links: socialLinks,
    eth_chain_id: ethChainId ? +ethChainId : undefined,
    cosmos_chain_id: cosmosChainId,
    node_url: nodeUrl,
    alt_wallet_url: altWalletUrl,
    user_address: userAddress,
    type: ChainType.Offchain,
    network: communityNetwork!,
    default_symbol: nameToSymbol,
    bech32_prefix: bech32Prefix,
    token_name: tokenName,
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
