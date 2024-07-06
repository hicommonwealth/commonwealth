import { useState } from 'react';
import { ChainBase, ChainNetwork } from '@hicommonwealth/shared';
import useCreateCommunityMutation from 'state/api/communities/createCommunity';
import { slugifyPreserveDashes } from 'utils';
import { chainTypes } from '../views/pages/CreateCommunity/steps/BasicInformationStep/BasicInformationForm/constants';
import useNamespaceFactory from '../views/pages/CreateCommunity/steps/CommunityStakeStep/useNamespaceFactory';
import useLaunchCommunityStake from '../views/pages/CreateCommunity/steps/CommunityStakeStep/SignStakeTransactions/useLaunchCommunityStake';
import app from '../state';

const DEFAULT_CHAIN_ID = '8453'; // Ethereum Mainnet

const useQuickCreateCommunity = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: createCommunityMutation } = useCreateCommunityMutation();
  const { namespaceFactory } = useNamespaceFactory(parseInt(DEFAULT_CHAIN_ID));
  const { handleLaunchCommunityStake } = useLaunchCommunityStake({
    namespace: '',
    communityId: '',
    goToSuccessStep: () => {},
    selectedAddress: '',
    chainId: DEFAULT_CHAIN_ID,
  });

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
      const symbol = name.slice(0, 4).toUpperCase();

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
}

export default useQuickCreateCommunity;