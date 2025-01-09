import { PinnedTokenWithPrices } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { GetTokenMetadataResponse } from 'state/api/tokens/getTokenMetadata';
import { z } from 'zod';
import { TradingMode } from '../types';

export type UniswapToken = {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
};

export type ExternalToken = z.infer<typeof PinnedTokenWithPrices> &
  GetTokenMetadataResponse;

export type UniswapTradingConfig = {
  mode: TradingMode.Swap;
  token: ExternalToken;
  addressType: ChainBase;
};

export type UniswapTradeTokenModalProps = {
  isOpen: boolean;
  onModalClose?: () => void;
  tradeConfig: UniswapTradingConfig;
};

export type UseUniswapTradeModalProps = {
  tradeConfig: UniswapTradingConfig;
};
