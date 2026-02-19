import { SupportedCryptoCurrencies } from 'helpers/currency';
import React from 'react';
import useBeforeUnload from 'shared/hooks/useBeforeUnload';
import { CWText } from '../../../components/component_kit/cw_text';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../../components/component_kit/new_designs/CWModal';
import TokenIcon from '../TokenIcon';
import './CommonTradeModal.scss';
import TradeTokenForm, {
  useCommonTradeTokenForm,
} from './CommonTradeTokenForm';
import { CommonTradeTokenModalProps } from './types';

const CommonTradeModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: CommonTradeTokenModalProps) => {
  const { trading, addresses, isActionPending, onCTAClick } =
    useCommonTradeTokenForm({
      tradeConfig: {
        ...tradeConfig,
        buyCurrency: SupportedCryptoCurrencies.ETH,
        buyTokenPresetAmounts: [0.000555, 0.00555, 0.0555],
        sellTokenPresetAmounts: ['25%', '50%', '75%', 'Max'],
      },
      addressType: tradeConfig.addressType,
      onTradeComplete: () => onModalClose?.(),
    });

  useBeforeUnload(isActionPending);

  return (
    <CWModal
      open={isOpen}
      onClose={() => onModalClose?.()}
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
            onModalClose={() => onModalClose?.()}
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
