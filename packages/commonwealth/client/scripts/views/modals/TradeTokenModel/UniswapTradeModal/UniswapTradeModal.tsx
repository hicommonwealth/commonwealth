import { getChainName, ValidChains } from '@hicommonwealth/evm-protocols';
import { ChainBase } from '@hicommonwealth/shared';
import { SupportedChainId, SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useNetworkSwitching } from 'hooks/useNetworkSwitching';
import NodeInfo, { ChainNode } from 'models/NodeInfo';
import React, { useEffect, useMemo, useState } from 'react';
import {
  useGetCommunityByIdQuery,
  useGetPinnedTokenByCommunityId,
} from 'state/api/communities';
import { fetchNodes } from 'state/api/nodes';
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
import { formatJsonRpcMap } from 'views/modals/TradeTokenModel/UniswapTradeModal/useJsonRpcUrlMap';
import { LaunchpadToken } from '../CommonTradeModal/types';
import TokenIcon from '../TokenIcon';
import './UniswapTradeModal.scss';
import { ExternalToken, UniswapTradeTokenModalProps } from './types';
import useUniswapTradeModal from './useUniswapTradeModal';

const UniswapTradeModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: UniswapTradeTokenModalProps) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data: tokenCommunity } = useGetCommunityByIdQuery({
    id: tradeConfig.token.community_id,
    enabled: !!tradeConfig.token.community_id,
    includeNodeInfo: true,
  });

  const { data: communityPinnedTokens } = useGetPinnedTokenByCommunityId({
    community_ids: tradeConfig.token.community_id
      ? [tradeConfig.token.community_id]
      : [],
    with_chain_node: true,
    enabled: !!tradeConfig.token.community_id,
  });
  const communityPinnedToken = communityPinnedTokens?.[0];

  const ethChainId =
    communityPinnedToken?.ChainNode?.eth_chain_id ||
    tokenCommunity?.ChainNode?.eth_chain_id;
  const networkName =
    communityPinnedToken?.ChainNode?.name || tokenCommunity?.ChainNode?.name;
  const rpcUrl =
    communityPinnedToken?.ChainNode?.url || tokenCommunity?.ChainNode?.url;
  const blockExplorerUrl =
    communityPinnedToken?.ChainNode?.block_explorer ||
    tokenCommunity?.ChainNode?.block_explorer;

  const { uniswapWidget, isMagicUser, isMagicConfigured } =
    useUniswapTradeModal({
      tradeConfig,
      ethChainId,
      rpcUrl,
      blockExplorerUrl,
      node:
        communityPinnedToken?.ChainNode || tokenCommunity?.ChainNode
          ? new NodeInfo(
              (communityPinnedToken?.ChainNode ||
                tokenCommunity?.ChainNode) as ChainNode,
            )
          : undefined,
    });

  const { currentChain, isWrongNetwork, promptNetworkSwitch } =
    useNetworkSwitching({
      ethChainId,
      rpcUrl,
      provider: uniswapWidget.provider,
    });

  const handleConnectWallet = () => {
    if (isWrongNetwork) {
      void promptNetworkSwitch().then(() => {
        if (!isWrongNetwork) {
          setIsAuthModalOpen(true);
        }
      });
      return false;
    }
    setIsAuthModalOpen(true);
    return false;
  };

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

  useEffect(() => {
    if (isOpen && isWrongNetwork) {
      void promptNetworkSwitch();
    }
  }, [isOpen, isWrongNetwork, promptNetworkSwitch]);

  const [nodes, setNodes] = useState<NodeInfo[]>();
  useEffect(() => {
    fetchNodes().then(setNodes).catch(console.error);
  }, []);

  // Ensure jsonRpcUrlMap includes the current chain's RPC URL
  // This is critical for chains like Soneium that might not be in the nodes list
  // IMPORTANT: Initialize with current chain FIRST to ensure it's always present
  // before the widget tries to access it during initialization
  const jsonRpcUrlMap = useMemo(() => {
    // Start with nodes map (if available)
    const map: { [chainId: number]: string[] } = formatJsonRpcMap(nodes) || {};

    // ALWAYS ensure current chain's RPC URL is in the map (highest priority)
    // This must be done even if nodes haven't loaded yet
    if (ethChainId && rpcUrl) {
      const urls = rpcUrl
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
      if (urls.length > 0) {
        // Override with current chain's RPC URL to ensure it's always correct
        map[ethChainId] = urls;
      }
    }

    return map;
  }, [nodes, ethChainId, rpcUrl]);

  // Ensure the map has the current chain before rendering the widget
  const isJsonRpcUrlMapReady = useMemo(() => {
    if (!ethChainId || !rpcUrl) {
      return false;
    }
    // Check if the map has the current chain ID
    return !!jsonRpcUrlMap[ethChainId] && jsonRpcUrlMap[ethChainId].length > 0;
  }, [jsonRpcUrlMap, ethChainId, rpcUrl]);

  const logo =
    (tradeConfig.token as ExternalToken).logo ||
    (tradeConfig.token as LaunchpadToken).icon_url;

  const supportedChainIds = Object.values(SupportedChainId).filter(
    (value) => typeof value === 'number',
  ) as number[];

  // Add Soneium (1868) to supported chains as it's supported by Uniswap API
  // even if not yet in the SupportedChainId enum from the widget package
  const additionalSupportedChains = [ValidChains.Soneium]; // Soneium
  const allSupportedChainIds = [
    ...supportedChainIds,
    ...additionalSupportedChains,
  ];

  if (!allSupportedChainIds.includes(ethChainId!)) {
    return (
      <CWModal
        open={isOpen}
        onClose={() => {
          onModalClose?.();
        }}
        size="medium"
        className="UnsupportedChainModal"
        content={
          <>
            <CWModalHeader
              label={<CWText type="h4">Unsupported Network</CWText>}
              onModalClose={onModalClose || (() => {})}
            />
            <CWModalBody>
              <CWText>
                The community connected network:{' '}
                {getChainName({ id: ethChainId! })} is not supported on Uniswap.
                Please switch to a supported network such as Base or Mainnet.
              </CWText>
            </CWModalBody>
            <CWModalFooter>
              <CWButton
                label="Close"
                buttonType="primary"
                onClick={() => {
                  onModalClose?.();
                }}
              />
            </CWModalFooter>
          </>
        }
      />
    );
  }
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
                    {logo && <TokenIcon size="large" url={logo} />}
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
                              label={`Switch to ${networkName}`}
                              buttonHeight="sm"
                              buttonType="secondary"
                              onClick={() => void promptNetworkSwitch()}
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
                {!uniswapWidget.isReady || !isJsonRpcUrlMapReady ? (
                  <CWCircleMultiplySpinner />
                ) : (
                  <SwapWidget
                    key={`swap-widget-${ethChainId}-${isJsonRpcUrlMapReady}`}
                    className={`uniswap-widget-wrapper ${isWrongNetwork ? 'disabled-overlay' : ''}`}
                    tokenList={uniswapWidget.tokensList}
                    routerUrl={uniswapWidget.routerURLs.default}
                    jsonRpcUrlMap={jsonRpcUrlMap}
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
                    onConnectWalletClick={handleConnectWallet}
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
                  onClick={() => void promptNetworkSwitch()}
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
