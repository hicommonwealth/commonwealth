import { SupportedCurrencies } from 'helpers/currency';
import useBeforeUnload from 'hooks/useBeforeUnload';
import React from 'react';
import { CWText } from '../../../components/component_kit/cw_text';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../../components/component_kit/new_designs/CWModal';
import TokenIcon from '../TokenIcon';
import { TradeTokenModalProps } from '../types';
import './CommonTradeModal.scss';
import TradeTokenForm, {
  useCommonTradeTokenForm,
} from './CommonTradeTokenForm';

const TRADING_CURRENCY = SupportedCurrencies.USD; // make configurable when needed

const CommonTradeModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: TradeTokenModalProps) => {
  const { trading, addresses, isActionPending, onCTAClick } =
    useCommonTradeTokenForm({
      tradeConfig: {
        ...tradeConfig,
        ethBuyCurrency: TRADING_CURRENCY,
        buyTokenPresetAmounts: [100, 300, 1000],
        sellTokenPresetAmounts: ['Max'],
      },
      addressType: tradeConfig.addressType,
      onTradeComplete: () => onModalClose?.(),
    });

  useBeforeUnload(isActionPending);

  return (
    <CWModal
      open={isOpen}
      onClose={() => !isActionPending && onModalClose?.()}
      size="medium"
      className="CommonTradeModal"
      content={
        <>
          <CWModalHeader
            label={
              <CWText type="h4" className="token-info">
                Trade Token - {tradeConfig.token.symbol}{' '}
                {trading.token.icon_url && (
                  <TokenIcon size="large" url={trading.token.icon_url} />
                )}
              </CWText>
            }
            onModalClose={() => !isActionPending && onModalClose?.()}
          />
          <CWModalBody>
            <TradeTokenForm
              trading={trading}
              addresses={addresses}
              onCTAClick={onCTAClick}
              isActionPending={isActionPending}
            />
          </CWModalBody>
          <CWModalFooter>
            <></>
          </CWModalFooter>
        </>
      }
    />
  );
};

export default CommonTradeModal;
