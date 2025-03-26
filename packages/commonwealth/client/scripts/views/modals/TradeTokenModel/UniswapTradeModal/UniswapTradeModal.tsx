import { ChainBase } from '@hicommonwealth/shared';
import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useNetworkSwitching } from 'hooks/useNetworkSwitching';
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

  const { currentChain, isWrongNetwork, promptNetworkSwitch } =
    useNetworkSwitching({
      jsonRpcUrlMap: uniswapWidget.jsonRpcUrlMap,
      provider: uniswapWidget.provider,
    });

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

  // Auto-connect for Magic users when widget is ready and Magic is configured
  useEffect(() => {
    if (
      isMagicUser &&
      isMagicConfigured &&
      uniswapWidget.isReady &&
      !uniswapWidget.provider
    ) {
      uniswapWidget.connectWallet().catch(() => {
        notifyError(
          'There was an error connecting your wallet. Please try again.',
        );
      });
    }
  }, [
    uniswapWidget,
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
                    onError={() => {
                      notifyError(
                        'There was an error with the swap widget. Please try again.',
                      );
                    }}
                    onTxFail={() => {
                      notifyError('Transaction failed. Please try again.');
                    }}
                    onTxSuccess={() => {
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
          uniswapWidget.connectWallet().catch(() => {
            notifyError('Failed to connect wallet. Please try again.');
          });
        }}
      />
    </>
  );
};

export default UniswapTradeModal;
