import { TradingConfig } from '../types';

export type UseUniswapTradeModalProps = {
  tradeConfig: TradingConfig;
};

export type UniswapToken = {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
};
