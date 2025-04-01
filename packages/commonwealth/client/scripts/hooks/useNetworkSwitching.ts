import { notifyError } from 'controllers/app/notifications';
import { BASE_CHAIN_ID, BASE_GOERLI_CHAIN_ID } from 'helpers/constants';
import { useEffect, useState } from 'react';

export const chainNames: Record<string, string> = {
  '0x1': 'Ethereum',
  '0x89': 'Polygon',
  '0xa': 'Optimism',
  '0xa4b1': 'Arbitrum',
  '0x2105': 'Base',
  '0x14a33': 'Base Goerli',
};

interface UseNetworkSwitchingProps {
  jsonRpcUrlMap: Record<number, string[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider?: any;
}

export function useNetworkSwitching({
  jsonRpcUrlMap,
  provider,
}: UseNetworkSwitchingProps) {
  const [currentChain, setCurrentChain] = useState<string | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const windowEthereum = window as any;

  // Check current network and update state
  useEffect(() => {
    const checkCurrentNetwork = async () => {
      // Use any available provider to check current network
      const activeProvider =
        windowEthereum.ethereum ||
        provider?.provider ||
        (jsonRpcUrlMap && Object.keys(jsonRpcUrlMap).length > 0
          ? { request: () => null }
          : null);

      if (!activeProvider) return;

      try {
        // Get current chain ID
        const currentChainIdHex = await activeProvider.request({
          method: 'eth_chainId',
        });

        // Get target chain ID for Base network
        const baseChainId = Object.keys(jsonRpcUrlMap).find(
          (id) =>
            Number(id) === BASE_CHAIN_ID || Number(id) === BASE_GOERLI_CHAIN_ID,
        ); // Base mainnet or testnet

        const baseChainIdHex = baseChainId
          ? `0x${Number(baseChainId).toString(16)}`
          : null;

        // Set current chain name
        setCurrentChain(
          chainNames[currentChainIdHex as string] ||
            `Chain ID ${currentChainIdHex}`,
        );

        // Check if on the wrong network
        setIsWrongNetwork(
          baseChainIdHex !== null && currentChainIdHex !== baseChainIdHex,
        );
      } catch (error) {
        console.error('Failed to check current network:', error);
      }
    };

    void checkCurrentNetwork();
  }, [provider, jsonRpcUrlMap, windowEthereum]);

  const promptNetworkSwitch = async () => {
    if (!isWrongNetwork || !windowEthereum.ethereum) return;

    // Find Base chain ID
    const baseChainId = Object.keys(jsonRpcUrlMap).find(
      (id) =>
        Number(id) === BASE_CHAIN_ID || Number(id) === BASE_GOERLI_CHAIN_ID,
    );

    if (!baseChainId) return;

    const baseChainIdHex = `0x${Number(baseChainId).toString(16)}`;

    try {
      // Try to switch to Base network
      await windowEthereum.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseChainIdHex }],
      });

      // Update status after switching
      setIsWrongNetwork(false);
      setCurrentChain('Base');
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      if (
        switchError &&
        typeof switchError === 'object' &&
        'code' in switchError &&
        switchError.code === 4902
      ) {
        try {
          await windowEthereum.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: baseChainIdHex,
                chainName: 'Base Mainnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: jsonRpcUrlMap[Number(baseChainId)] || [
                  'https://mainnet.base.org',
                ],
                blockExplorerUrls: ['https://basescan.org'],
              },
            ],
          });

          // Update status after adding network
          setIsWrongNetwork(false);
          setCurrentChain('Base');
        } catch (addError) {
          notifyError('Failed to add the Base network to your wallet.');
        }
      } else {
        notifyError('Failed to switch to the Base network.');
      }
    }
  };

  return {
    currentChain,
    isWrongNetwork,
    promptNetworkSwitch,
  };
}
