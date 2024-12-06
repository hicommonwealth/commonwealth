import { TradingConfig } from './CommonTradeModal/TradeTokenForm';

export type TradeTokenModalProps = {
  isOpen: boolean;
  onModalClose?: () => void;
  tradeConfig: TradingConfig;
};
