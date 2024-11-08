import { SupportedCurrencies } from 'helpers/currency';
import React from 'react';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import TradeTokenForm, {
  TradingConfig,
  useTokenTradeForm,
} from './TradeTokenForm';
import './TradeTokenModal.scss';

const TRADING_CURRENCY = SupportedCurrencies.USD; // make configurable when needed

type TradeTokenModalProps = {
  isOpen: boolean;
  onModalClose?: () => void;
  tradeConfig: TradingConfig;
};

const TradeTokenModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: TradeTokenModalProps) => {
  const {
    tradingAmount,
    onTradingAmountChange,
    tradingMode,
    onTradingModeChange,
    userAddresses,
    isActionPending,
    onCTAClick,
  } = useTokenTradeForm({
    tradeConfig: { ...tradeConfig, currency: TRADING_CURRENCY },
    addressType: tradeConfig.addressType,
  });

  return (
    <CWModal
      open={isOpen}
      onClose={() => onModalClose?.()}
      size="medium"
      className="AuthModal"
      content={
        <>
          <CWModalHeader
            label="Trade Tokens"
            onModalClose={() => onModalClose?.()}
          />
          <CWModalBody>
            <TradeTokenForm
              tradingMode={tradingMode}
              onTradingModeChange={onTradingModeChange}
              tradingAmount={tradingAmount}
              onTradingAmountChange={onTradingAmountChange}
              trading={{
                currency: TRADING_CURRENCY,
                presetAmounts: [100, 300, 1000],
              }}
              addresses={userAddresses}
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

export default TradeTokenModal;
