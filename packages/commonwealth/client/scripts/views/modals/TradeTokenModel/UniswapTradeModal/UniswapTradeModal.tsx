import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import { notifySuccess } from 'controllers/app/notifications';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import TokenIcon from '../TokenIcon';
import { TradeTokenModalProps } from '../types';
import './UniswapTradeModal.scss';
import useUniswapTradeModal from './useUniswapTradeModal';

const UniswapTradeModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: TradeTokenModalProps) => {
  const { uniswapWidget } = useUniswapTradeModal({ tradeConfig });

  return (
    <CWModal
      open={isOpen}
      onClose={() => onModalClose?.()}
      size="medium"
      className="UniswapTradeModal"
      content={
        <>
          <CWModalHeader
            label={
              <CWText type="h4" className="token-info">
                Swap Token - {tradeConfig.token.symbol}{' '}
                {tradeConfig.token.icon_url && (
                  <TokenIcon size="large" url={tradeConfig.token.icon_url} />
                )}
              </CWText>
            }
            onModalClose={() => onModalClose?.()}
          />
          <CWModalBody>
            <div className="Uniswap">
              {!uniswapWidget.isReady ? (
                <CWCircleMultiplySpinner />
              ) : (
                <SwapWidget
                  className="uniswap-widget-wrapper"
                  tokenList={uniswapWidget.tokensList}
                  routerUrl={uniswapWidget.routerURLs.default}
                  theme={uniswapWidget.theme}
                  defaultInputTokenAddress={
                    uniswapWidget.defaultTokenAddress.input
                  }
                  defaultOutputTokenAddress={
                    uniswapWidget.defaultTokenAddress.output
                  }
                  hideConnectionUI={true}
                  {...(uniswapWidget.evmClient && {
                    evmClient: uniswapWidget.evmClient,
                  })}
                  onError={console.error}
                  onTxFail={console.error}
                  onTxSuccess={() => notifySuccess('Transaction successful!')}
                />
              )}
            </div>
          </CWModalBody>
          <CWModalFooter>
            <></>
          </CWModalFooter>
        </>
      }
    />
  );
};

export default UniswapTradeModal;
