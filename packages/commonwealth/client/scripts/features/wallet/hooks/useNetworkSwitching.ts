import { getChainHex, getChainName } from '@hicommonwealth/evm-protocols';
import { notifyError } from 'controllers/app/notifications';
import { useEffect, useState } from 'react';

interface UseNetworkSwitchingProps {
  ethChainId?: number | null;
  rpcUrl?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider?: any;
}

export function useNetworkSwitching({
  ethChainId,
  rpcUrl,
  provider,
}: UseNetworkSwitchingProps) {
  const [currentChain, setCurrentChain] = useState<string | undefined>(
    undefined,
  );
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
        (rpcUrl ?? { request: () => null });

      if (!activeProvider) return;

      try {
        // Get current chain ID
        const currentChainIdHex = await activeProvider.request({
          method: 'eth_chainId',
        });

        const formattedChainId = ethChainId ? getChainHex(ethChainId) : null;

        // Set current chain name
        setCurrentChain(`Chain ID ${getChainName({ hex: currentChainIdHex })}`);

        // Check if on the wrong network
        setIsWrongNetwork(
          formattedChainId !== null && currentChainIdHex !== formattedChainId,
        );
      } catch (error) {
        console.error('Failed to check current network:', error);
      }
    };

    void checkCurrentNetwork();
  }, [ethChainId, provider, rpcUrl, windowEthereum]);

  const promptNetworkSwitch = async () => {
    if (!isWrongNetwork || !windowEthereum.ethereum) return;

    const chainHex = getChainHex(Number(ethChainId));

    try {
      // Try to switch to Base network
      await windowEthereum.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainHex }],
      });

      // Update status after switching
      setIsWrongNetwork(false);
      setCurrentChain(getChainName({ hex: chainHex }));
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
                chainId: chainHex,
                chainName: 'Base Mainnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [rpcUrl],
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
        notifyError('Failed to switch to networks.');
      }
    }
  };

  return {
    currentChain,
    isWrongNetwork,
    promptNetworkSwitch,
  };
}
