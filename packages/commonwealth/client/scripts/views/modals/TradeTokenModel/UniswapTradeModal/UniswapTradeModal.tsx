import { ChainBase } from '@hicommonwealth/shared';
import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useEffect, useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { AuthModal } from 'views/modals/AuthModal';
import TokenIcon from '../TokenIcon';
import './UniswapTradeModal.scss';
import { UniswapTradeTokenModalProps } from './types';
import useUniswapTradeModal from './useUniswapTradeModal';

const UniswapTradeModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: UniswapTradeTokenModalProps) => {
  const { uniswapWidget, isMagicUser, isMagicConfigured } =
    useUniswapTradeModal({ tradeConfig });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentChain, setCurrentChain] = useState<string | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // Type-safe window.ethereum
  const windowEthereum = window as any;

  // Suppress the React DOM prop warning for fadeAnimation
  useEffect(() => {
    // Save original console.error
    const originalConsoleError = console.error;

    // Filter out the specific warning about fadeAnimation
    console.error = (...args) => {
      if (
        args[0]?.includes &&
        (args[0].includes('fadeAnimation') ||
          (typeof args[0] === 'string' && args[0].includes('hideOverflow')))
      ) {
        return;
      }
      originalConsoleError(...args);
    };

    // Restore original on unmount
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Check current network and update state
  useEffect(() => {
    const checkCurrentNetwork = async () => {
      // Use any available provider to check current network
      const provider =
        windowEthereum.ethereum ||
        uniswapWidget.provider?.provider ||
        (uniswapWidget.jsonRpcUrlMap &&
        Object.keys(uniswapWidget.jsonRpcUrlMap).length > 0
          ? { request: async () => null }
          : null);

      if (!provider) return;

      try {
        // Get current chain ID
        const currentChainIdHex = await provider.request({
          method: 'eth_chainId',
        });

        // Get target chain ID for Base network
        const baseChainId = Object.keys(uniswapWidget.jsonRpcUrlMap).find(
          (id) => Number(id) === 8453 || Number(id) === 84531,
        ); // Base mainnet or testnet

        const baseChainIdHex = baseChainId
          ? `0x${Number(baseChainId).toString(16)}`
          : null;

        // Map hex chain IDs to readable names
        const chainNames: Record<string, string> = {
          '0x1': 'Ethereum',
          '0x89': 'Polygon',
          '0xa': 'Optimism',
          '0xa4b1': 'Arbitrum',
          '0x2105': 'Base',
          '0x14a33': 'Base Goerli',
        };

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

    checkCurrentNetwork();
  }, [uniswapWidget.provider, uniswapWidget.jsonRpcUrlMap]);

  // Function to handle network switching
  const promptNetworkSwitch = async () => {
    if (!isWrongNetwork || !windowEthereum.ethereum) return;

    // Find Base chain ID
    const baseChainId = Object.keys(uniswapWidget.jsonRpcUrlMap).find(
      (id) => Number(id) === 8453 || Number(id) === 84531,
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
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
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
                rpcUrls: uniswapWidget.jsonRpcUrlMap[Number(baseChainId)] || [
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

  // Auto-connect for Magic users when widget is ready and Magic is configured
  useEffect(() => {
    if (
      isMagicUser &&
      isMagicConfigured &&
      uniswapWidget.isReady &&
      !uniswapWidget.provider
    ) {
      uniswapWidget.connectWallet().catch((error) => {
        notifyError(
          'There was an error connecting your wallet. Please try again.',
        );
      });
    }
  }, [
    isMagicUser,
    isMagicConfigured,
    uniswapWidget.isReady,
    uniswapWidget.provider,
    uniswapWidget.connectWallet,
  ]);

  return (
    <>
      <CWModal
        open={isOpen}
        onClose={() => {
          onModalClose?.();
        }}
        size="medium"
        className="UniswapTradeModal"
        content={
          <>
            <CWModalHeader
              label={
                <div className="header-content">
                  <CWText type="h4" className="token-info">
                    Swap Token - {tradeConfig.token.symbol}{' '}
                    {tradeConfig.token.logo && (
                      <TokenIcon size="large" url={tradeConfig.token.logo} />
                    )}
                  </CWText>

                  {/* Network indicator moved to header */}
                  {currentChain && (
                    <div className="network-indicator swap-network-indicator">
                      <CWText type="caption" className="current-network">
                        Current network:
                        <span
                          className={
                            isWrongNetwork ? 'wrong-network' : 'correct-network'
                          }
                        >
                          {' '}
                          {currentChain}
                        </span>
                        {isWrongNetwork && (
                          <>
                            {withTooltip(
                              <CWIcon
                                iconName="warning"
                                iconSize="small"
                                className="warning-icon"
                              />,
                              'Swaps only work on the Base network. Click to switch networks.',
                              true,
                            )}
                            <CWButton
                              label="Switch to Base"
                              buttonHeight="sm"
                              buttonType="secondary"
                              onClick={promptNetworkSwitch}
                            />
                          </>
                        )}
                      </CWText>
                    </div>
                  )}
                </div>
              }
              onModalClose={onModalClose || (() => {})}
            />
            <CWModalBody>
              {/* Removed network indicator from here */}
              {/* Swap widget container with click handler to prompt network switch */}
              <div
                className="Uniswap"
                onClick={isWrongNetwork ? promptNetworkSwitch : undefined}
              >
                {!uniswapWidget.isReady ? (
                  <CWCircleMultiplySpinner />
                ) : (
                  <SwapWidget
                    className={`uniswap-widget-wrapper ${isWrongNetwork ? 'disabled-overlay' : ''}`}
                    tokenList={uniswapWidget.tokensList}
                    routerUrl={uniswapWidget.routerURLs.default}
                    jsonRpcUrlMap={uniswapWidget.jsonRpcUrlMap}
                    theme={uniswapWidget.theme}
                    defaultInputTokenAddress={
                      uniswapWidget.defaultTokenAddress.input
                    }
                    defaultOutputTokenAddress={
                      uniswapWidget.defaultTokenAddress.output
                    }
                    convenienceFee={uniswapWidget.convenienceFee.percentage}
                    convenienceFeeRecipient={
                      uniswapWidget.convenienceFee.recipient
                    }
                    // Hide connection UI if user is logged in with Magic
                    hideConnectionUI={isMagicUser && isMagicConfigured}
                    onConnectWalletClick={async () => {
                      // Check if we need to switch networks first
                      if (isWrongNetwork) {
                        await promptNetworkSwitch();
                        // If still on wrong network, abort wallet connection
                        if (isWrongNetwork) return false;
                      }

                      // Show auth modal instead of connecting directly
                      setIsAuthModalOpen(true);
                      return false; // Return false to prevent the widget from proceeding with its own connection flow
                    }}
                    provider={uniswapWidget.provider}
                    onError={(error) => {
                      notifyError(
                        'There was an error with the swap widget. Please try again.',
                      );
                    }}
                    onTxFail={(error) => {
                      notifyError('Transaction failed. Please try again.');
                    }}
                    onTxSuccess={(hash) => {
                      notifySuccess('Transaction successful!');
                    }}
                  />
                )}
              </div>
            </CWModalBody>
            <CWModalFooter>
              {isWrongNetwork && (
                <CWButton
                  label="Switch to Base Network"
                  buttonType="primary"
                  buttonAlt="green"
                  onClick={promptNetworkSwitch}
                />
              )}
            </CWModalFooter>
          </>
        }
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        showWalletsFor={ChainBase.Ethereum}
        onSuccess={() => {
          // After successful authentication, try to connect the wallet
          uniswapWidget.connectWallet().catch((error) => {
            notifyError('Failed to connect wallet. Please try again.');
          });
        }}
      />
    </>
  );
};

export default UniswapTradeModal;

// Export a standalone NetworkIndicator component for direct embedding
export const NetworkIndicator = ({
  currentChain,
  isWrongNetwork,
  onSwitchNetwork,
}: {
  currentChain: string | null;
  isWrongNetwork: boolean;
  onSwitchNetwork: () => void;
}) => {
  if (!currentChain) return null;

  return (
    <div className="network-indicator swap-network-indicator">
      <CWText type="caption" className="current-network">
        Current network:
        <span className={isWrongNetwork ? 'wrong-network' : 'correct-network'}>
          {' '}
          {currentChain}
        </span>
        {isWrongNetwork && (
          <>
            {withTooltip(
              <CWIcon
                iconName="warning"
                iconSize="small"
                className="warning-icon"
              />,
              'Swaps only work on the Base network. Click to switch networks.',
              true,
            )}
            <CWButton
              label="Switch to Base"
              buttonHeight="sm"
              buttonType="secondary"
              onClick={onSwitchNetwork}
            />
          </>
        )}
      </CWText>
    </div>
  );
};
