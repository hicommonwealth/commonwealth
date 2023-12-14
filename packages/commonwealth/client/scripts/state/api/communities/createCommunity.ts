import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ChainBase, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { baseToNetwork } from 'helpers';
import app, { initAppState } from 'state';
import { updateAdminOnCreateCommunity } from 'views/pages/create_community/community_input_rows';

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
  bech32Prefix?: 'osmo';
}

const createCommunity = async ({
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
}: CreateCommunityProps) => {
  const nameToSymbol = name.toUpperCase().slice(0, 4);

  return await axios.post(`${app.serverUrl()}/communities`, {
    id,
    name,
    base: chainBase,
    description,
    icon_url: iconUrl,
    social_links: socialLinks,
    eth_chain_id: ethChainId,
    cosmos_chain_id: cosmosChainId,
    node_url: nodeUrl,
    alt_wallet_url: altWalletUrl,
    user_address: userAddress,

    type: ChainType.Offchain,
    network: baseToNetwork(chainBase),
    default_symbol: nameToSymbol,
    bech32_prefix: bech32Prefix,
    jwt: app.user.jwt,
  });
};

const useCreateCommunityMutation = () => {
  return useMutation({
    mutationFn: createCommunity,
    onSuccess: async ({ data }, variables) => {
      if (data?.result?.admin_address) {
        await linkExistingAddressToChainOrCommunity(
          data.result.admin_address,
          data.result.role.chain_id,
          data.result.role.chain_id,
        );
      }

      await initAppState(false);
      await updateAdminOnCreateCommunity(variables.id);
    },
  });
};

export default useCreateCommunityMutation;
