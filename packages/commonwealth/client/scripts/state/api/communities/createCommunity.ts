import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { baseToNetwork } from 'helpers';
import app, { initAppState } from 'state';
import { userStore } from '../../ui/user';

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
  isPWA,
}: CreateCommunityProps) => {
  const nameToSymbol = name.toUpperCase().slice(0, 4);
  const communityNetwork =
    chainBase === ChainBase.CosmosSDK
      ? cosmosChainId
      : baseToNetwork(chainBase);

  return await axios.post(
    `${app.serverUrl()}/communities`,
    {
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
      network: communityNetwork,
      default_symbol: nameToSymbol,
      bech32_prefix: bech32Prefix,
      jwt: userStore.getState().jwt,
    },
    {
      headers: {
        isPWA: isPWA?.toString(),
      },
    },
  );
};

const useCreateCommunityMutation = () => {
  return useMutation({
    mutationFn: createCommunity,
    onSuccess: async ({ data }) => {
      if (data?.result?.admin_address) {
        await linkExistingAddressToChainOrCommunity(
          data.result.admin_address,
          data.result.community.id,
          data.result.community.id,
        );
      }

      await initAppState(false);
    },
  });
};

export default useCreateCommunityMutation;
