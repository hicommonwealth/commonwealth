import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ChainBase, ChainType } from 'common-common/src/types';
import { baseToNetwork } from 'helpers';
import app from 'state';

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
    jwt: app.user.jwt,

    // address: '', ??
    // bech32_prefix => ??
  });
};

const useCreateCommunityMutation = () => {
  return useMutation({
    mutationFn: createCommunity,
    onSuccess: async () => {
      console.log('success');
    },
  });
};

export default useCreateCommunityMutation;
