import {
  CommonTradeTokenModalProps,
  CommonTradingConfig,
} from './CommonTradeModal/types';
import {
  UniswapTradeTokenModalProps,
  UniswapTradingConfig,
} from './UniswapTradeModal/types';

export enum TradingMode {
  Buy = 'buy', // for trade on common
  Sell = 'sell', // for trade on common
  Swap = 'swap', // for trade via uniswap
}

export type TradingConfig = CommonTradingConfig | UniswapTradingConfig;

export type TradeTokenModalProps =
  | CommonTradeTokenModalProps
  | UniswapTradeTokenModalProps;
