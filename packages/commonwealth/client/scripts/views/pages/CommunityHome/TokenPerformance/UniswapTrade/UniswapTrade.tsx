import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import TokenIcon from 'client/scripts/views/modals/TradeTokenModel/TokenIcon';
import { UniswapTradeTokenModalProps } from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import useUniswapTradeModal from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/useUniswapTradeModal';
import { notifySuccess } from 'controllers/app/notifications';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';

import './UniswapTrade.scss';

interface UniswapTradeProps {
  tradeConfig: UniswapTradeTokenModalProps['tradeConfig'];
}

const UniswapTrade = ({ tradeConfig }: UniswapTradeProps) => {
  const { uniswapWidget } = useUniswapTradeModal({ tradeConfig });

  return (
    <div className="UniswapTrade">
      <div className="token-info">
        <CWText type="h4">
          Swap Token - {tradeConfig.token.symbol}{' '}
          {tradeConfig.token.logo && (
            <TokenIcon size="large" url={tradeConfig.token.logo} />
          )}
        </CWText>
      </div>

      <div className="Uniswap">
        {!uniswapWidget.isReady ? (
          <CWCircleMultiplySpinner />
        ) : (
          <SwapWidget
            className="uniswap-widget-wrapper"
            tokenList={uniswapWidget.tokensList}
            routerUrl={uniswapWidget.routerURLs.default}
            theme={uniswapWidget.theme}
            defaultInputTokenAddress={uniswapWidget.defaultTokenAddress.input}
            defaultOutputTokenAddress={uniswapWidget.defaultTokenAddress.output}
            convenienceFee={uniswapWidget.convenienceFee.percentage}
            convenienceFeeRecipient={uniswapWidget.convenienceFee.recipient}
            hideConnectionUI={true}
            {...(uniswapWidget.provider && {
              provider: uniswapWidget.provider,
            })}
            onError={console.error}
            onTxFail={console.error}
            onTxSuccess={() => notifySuccess('Transaction successful!')}
          />
        )}
      </div>
    </div>
  );
};

export default UniswapTrade;
