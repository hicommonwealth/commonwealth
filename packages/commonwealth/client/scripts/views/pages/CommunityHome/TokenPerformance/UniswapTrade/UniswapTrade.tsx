import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import TokenIcon from 'client/scripts/views/modals/TradeTokenModel/TokenIcon';
import { UniswapTradeTokenModalProps } from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import useUniswapTradeModal from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/useUniswapTradeModal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useNetworkSwitching } from 'hooks/useNetworkSwitching';
import React from 'react';
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
  const { currentChain, isWrongNetwork, promptNetworkSwitch } =
    useNetworkSwitching({
      jsonRpcUrlMap: uniswapWidget.jsonRpcUrlMap,
      provider: uniswapWidget.provider,
    });

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
        onSwitchNetwork={() => void promptNetworkSwitch()}
      />

      <div
        className="Uniswap"
        onClick={isWrongNetwork ? () => void promptNetworkSwitch() : undefined}
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
            onTxSuccess={() => notifySuccess('Transaction successful!')}
          />
        )}
      </div>
    </div>
  );
};

export default UniswapTrade;
