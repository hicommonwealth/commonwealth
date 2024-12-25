import React from 'react';
import CommonTradeModal from './CommonTradeModal';
import UniswapTradeModal from './UniswapTradeModal/UniswapTradeModal';
import { TradeTokenModalProps, TradingMode } from './types';

const TradeTokenModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: TradeTokenModalProps) => {
  if (tradeConfig.mode === TradingMode.Swap) {
    return (
      <UniswapTradeModal
        isOpen={isOpen}
        tradeConfig={tradeConfig}
        onModalClose={onModalClose}
      />
    );
  }

  return (
    <CommonTradeModal
      isOpen={isOpen}
      tradeConfig={tradeConfig}
      onModalClose={onModalClose}
    />
  );
};

export default TradeTokenModal;
