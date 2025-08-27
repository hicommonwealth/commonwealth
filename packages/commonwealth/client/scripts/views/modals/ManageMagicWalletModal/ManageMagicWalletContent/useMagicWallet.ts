import { ValidChains } from '@hicommonwealth/evm-protocols';
import useNecessaryEffect from 'client/scripts/hooks/useNecessaryEffect';
import { Magic } from 'magic-sdk';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFetchNodesQuery } from 'state/api/nodes';
import { getMagicForChain } from 'utils/magicNetworkUtils';
import Web3 from 'web3';

const DEFAULT_CHAIN_ID = ValidChains.Base;

interface UseMagicWalletProps {
  chainId?: number;
}

interface UseMagicWalletResult {
  magic: Magic | null;
  web3: Web3 | null;
  userAddress: string;
  isLoading: boolean;
}

const useMagicWallet = ({
  chainId = DEFAULT_CHAIN_ID,
}: UseMagicWalletProps = {}): UseMagicWalletResult => {
  const [magic, setMagic] = useState<Magic | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isFetchedWithDataRef = useRef<{
    chainId?: number;
    chainNodeId?: number;
  }>({
    chainId: undefined,
    chainNodeId: undefined,
  });

  const { data: nodes } = useFetchNodesQuery();
  const chainNode = useMemo(
    () => nodes?.find((n) => n.ethChainId === chainId),
    [nodes, chainId],
  );

  const initMagic = useCallback(async () => {
    if (
      isFetchedWithDataRef.current.chainId === chainId &&
      isFetchedWithDataRef.current.chainNodeId === chainNode?.id
    ) {
      return;
    }
    isFetchedWithDataRef.current.chainId = chainId;
    isFetchedWithDataRef.current.chainNodeId = chainNode?.id;

    try {
      setIsLoading(true);
      const effectiveChainId = chainNode?.ethChainId || chainId;

      const magicInstance = getMagicForChain(effectiveChainId, chainNode);

      setMagic(magicInstance);

      if (magicInstance) {
        const web3Instance = new Web3(magicInstance.rpcProvider);
        setWeb3(web3Instance);

        // Get user address
        try {
          const metadata = await magicInstance.user
            .getMetadata()
            .catch(() => null);
          if (metadata?.publicAddress) {
            setUserAddress(metadata.publicAddress);
          }
        } catch {
          // Not logged in
          console.log('User not logged in to Magic');
        }
      }
    } catch (error) {
      console.error('Error initializing Magic wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, chainNode]);

  useNecessaryEffect(() => {
    initMagic();
  }, [initMagic]);

  return {
    magic,
    web3,
    userAddress,
    isLoading,
  };
};

export default useMagicWallet;
