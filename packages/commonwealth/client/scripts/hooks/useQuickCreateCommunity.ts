import { ChainBase } from '@hicommonwealth/shared';
import { useState } from 'react';
import useCreateCommunityMutation from 'state/api/communities/createCommunity';
import { useFetchNodesQuery } from 'state/api/nodes';
import { slugifyPreserveDashes } from 'utils';
import { chainTypes } from '../views/pages/CreateCommunity/steps/BasicInformationStep/BasicInformationForm/constants';

const DEFAULT_CHAIN_ID = '8453'; // Ethereum Mainnet

// this
import { commonProtocol } from '@hicommonwealth/shared';
import Launchpad from 'helpers/ContractHelpers/Launchpad';

const useLaunchpad = (ethChainId: number) => {
  const { data: nodes } = useFetchNodesQuery();

  const launchpadAddress =
    commonProtocol.factoryContracts[ethChainId]?.launchpad;
  const chainRpc = nodes?.find((node) => node.ethChainId === ethChainId)?.url;

  // @ts-expect-error StrictNullChecks
  const launchpad = new Launchpad(launchpadAddress, chainRpc);

  return { launchpad };
};

const useQuickCreateCommunity = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: createCommunityMutation } = useCreateCommunityMutation();
  // const { namespaceFactory } = useNamespaceFactory(parseInt(DEFAULT_CHAIN_ID));
  // const { handleLaunchCommunityStake } = useLaunchCommunityStake({
  //   namespace: '',
  //   communityId: '',
  //   goToSuccessStep: () => {},
  //   selectedAddress: '',
  //   chainId: DEFAULT_CHAIN_ID,
  // });

  const { launchpad } = useLaunchpad(parseInt(DEFAULT_CHAIN_ID));

  const createCommunity = async (communityData: {
    name: string;
    description: string;
    icon_url: string;
    address: string;
    // Add any other required fields here
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { name, description, icon_url, address } = communityData;
      const communityId = slugifyPreserveDashes(name.toLowerCase());
      const symbol =
        name.slice(0, 4).toUpperCase() +
        Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0');

      const selectedChainNode = chainTypes.find(
        (chain) => String(chain.value) === DEFAULT_CHAIN_ID,
      );

      // Create community
      await createCommunityMutation({
        id: communityId,
        name,
        chainBase: ChainBase.Ethereum,
        description,
        iconUrl: icon_url,
        nodeUrl: selectedChainNode?.nodeUrl || '',
        altWalletUrl: selectedChainNode?.altWalletUrl || '',
        userAddress: address, // Get user address from app state
        ethChainId: DEFAULT_CHAIN_ID,
        socialLinks: [],
        // defaultStake: '0',
        // customDomain: '',
        // customStakeAmount: '0',
        // customStakeExpirationDays: 0,
      });

      // Launch token with liquidity using Launchpad
      const totalSupply = 1000000000; // Example value, adjust as needed
      const curveId = 0; // Example value, adjust as needed
      const scalar = 1000; // Example value, adjust as needed
      const LPhook = '0x0000000000000000000000000000000000000000'; // Example value, adjust as needed
      const launchAction = '0x'; // Example value, adjust as needed
      const value = '0'; // Example value, adjust as needed
      const airdropAddress = '0x0000000000000000000000000000000000000000';
      const govAddress = '0x0000000000000000000000000000000000000000';
      const LPBondingCurveAddress =
        '0x0000000000000000000000000000000000000000';

      // await launchpad.launchTokenWithLiquidity(
      //   name,
      //   symbol,
      //   [10, 20, 70], // Example shares, adjust as needed
      //   [airdropAddress, govAddress, LPBondingCurveAddress], // Example holders, adjust as needed
      //   totalSupply,
      //   curveId,
      //   scalar,
      //   LPhook,
      //   launchAction,
      //   address,
      // );

      // Reserve namespace
      //   await namespaceFactory.deployNamespace(
      //     communityId,
      //     app.user.activeAccount.address,
      //     app.user.activeAccount.address,
      //     DEFAULT_CHAIN_ID,
      //   );

      //   // Launch community stake
      //   await handleLaunchCommunityStake({
      //     namespace: communityId,
      //     communityId,
      //     goToSuccessStep: () => {}, // You might want to implement this callback
      //     selectedAddress: app.user.activeAccount.address,
      //     chainId: DEFAULT_CHAIN_ID,
      //   });

      setIsLoading(false);
    } catch (err) {
      setError('Failed to create community. Please try again.');
      setIsLoading(false);
      console.error('Error creating community:', err);
      throw err;
    }
  };

  return { createCommunity, isLoading, error };
};

export default useQuickCreateCommunity;
