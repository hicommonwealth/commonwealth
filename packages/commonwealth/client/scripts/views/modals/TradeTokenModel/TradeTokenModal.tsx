import React from 'react';
import CommonTradeModal from './CommonTradeModal';
import { TradeTokenModalProps } from './types';

const TradeTokenModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: TradeTokenModalProps) => {
  return (
    <CommonTradeModal
      isOpen={isOpen}
      tradeConfig={tradeConfig}
      onModalClose={onModalClose}
    />
  );
};

export default TradeTokenModal;
