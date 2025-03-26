import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import TokenIcon from 'client/scripts/views/modals/TradeTokenModel/TokenIcon';
import { UniswapTradeTokenModalProps } from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import useUniswapTradeModal from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/useUniswapTradeModal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { BASE_CHAIN_ID, BASE_GOERLI_CHAIN_ID } from 'helpers/constants';
import React, { useEffect, useState } from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { NetworkIndicator } from 'views/modals/TradeTokenModel/NetworkIndicator';

import './UniswapTrade.scss';

interface UniswapTradeProps {
  tradeConfig: UniswapTradeTokenModalProps['tradeConfig'];
}

const UniswapTrade = ({ tradeConfig }: UniswapTradeProps) => {
  const { uniswapWidget } = useUniswapTradeModal({ tradeConfig });
  const [currentChain, setCurrentChain] = useState<string | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // Type-safe window.ethereum
  const windowEthereum = window as any;

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
          (id) =>
            Number(id) === BASE_CHAIN_ID || Number(id) === BASE_GOERLI_CHAIN_ID,
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

  return (
    <div className="UniswapTrade">
      <div className="token-info">
        <CWText type="h4">
          Swap Token - {tradeConfig.token.symbol}{' '}
          {tradeConfig.token.logo && (
            <TokenIcon size="large" url={tradeConfig.token.logo} />
          )}
        </CWText>

        {/* Info tooltip disclaimer */}
        <span className="disclaimer">
          {withTooltip(
            <CWIconButton
              iconName="infoEmpty"
              iconSize="small"
              className="cursor-pointer"
            />,
            'Swaps only supports token on base',
            true,
          )}
        </span>
      </div>

      {/* Network indicator */}
      <NetworkIndicator
        currentChain={currentChain}
        isWrongNetwork={isWrongNetwork}
        onSwitchNetwork={promptNetworkSwitch}
      />

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
            defaultInputTokenAddress={uniswapWidget.defaultTokenAddress.input}
            defaultOutputTokenAddress={uniswapWidget.defaultTokenAddress.output}
            convenienceFee={uniswapWidget.convenienceFee.percentage}
            convenienceFeeRecipient={uniswapWidget.convenienceFee.recipient}
            hideConnectionUI={true}
            {...(uniswapWidget.provider && {
              provider: uniswapWidget.provider,
            })}
            onError={(error) => {
              console.error(error);
              notifyError(
                'There was an error with the swap widget. Please try again.',
              );
            }}
            onTxFail={(error) => {
              console.error(error);
              notifyError('Transaction failed. Please try again.');
            }}
            onTxSuccess={(hash) => notifySuccess('Transaction successful!')}
          />
        )}
      </div>
    </div>
  );
};

export default UniswapTrade;
