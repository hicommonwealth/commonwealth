import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { Magic } from 'magic-sdk';
import { useEffect, useState } from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import { getMagicForChain } from 'utils/magicNetworkUtils';
import Web3 from 'web3';
import { fetchUserAddress } from './utils';

const DEFAULT_CHAIN_ID = commonProtocol.ValidChains.Base;

interface UseMagicWalletProps {
  chainId?: number;
}

interface UseMagicWalletResult {
  magic: Magic | null;
  web3: Web3 | null;
  userAddress: string;
  isLoading: boolean;
  showWalletInfo: () => Promise<void>;
}

const useMagicWallet = ({
  chainId = DEFAULT_CHAIN_ID,
}: UseMagicWalletProps = {}): UseMagicWalletResult => {
  const [magic, setMagic] = useState<Magic | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initMagic = async () => {
      setIsLoading(true);
      try {
        const nodes = fetchCachedNodes();
        const chainNode = nodes?.find((n) => n.ethChainId === chainId);
        const effectiveChainId = chainNode?.ethChainId || chainId;

        const magicInstance = getMagicForChain(effectiveChainId);
        setMagic(magicInstance);

        if (magicInstance) {
          const web3Instance = new Web3(magicInstance.rpcProvider);
          setWeb3(web3Instance);

          // Get user address
          const address = await fetchUserAddress(web3Instance);
          setUserAddress(address);
        }
      } catch (error) {
        console.error('Error initializing Magic wallet:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initMagic();
  }, [chainId]);

  const showWalletInfo = async (): Promise<void> => {
    if (magic) {
      await magic.wallet.showUI();
    }
  };

  return {
    magic,
    web3,
    userAddress,
    isLoading,
    showWalletInfo,
  };
};

export default useMagicWallet;
