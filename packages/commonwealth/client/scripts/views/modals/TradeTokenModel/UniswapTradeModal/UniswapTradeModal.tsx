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
import './UniswapTradeModal.scss';
import { UniswapTradeTokenModalProps } from './types';
import useUniswapTradeModal from './useUniswapTradeModal';

const UniswapTradeModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: UniswapTradeTokenModalProps) => {
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
                {tradeConfig.token.logo && (
                  <TokenIcon size="large" url={tradeConfig.token.logo} />
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
                  convenienceFee={uniswapWidget.convenienceFee.percentage}
                  convenienceFeeRecipient={
                    uniswapWidget.convenienceFee.recipient
                  }
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
