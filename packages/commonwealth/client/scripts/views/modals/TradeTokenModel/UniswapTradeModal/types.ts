import { Web3Provider } from '@ethersproject/providers';
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

export type UniswapWidgetConfig = {
  isReady: boolean;
  provider?: Web3Provider;
  theme: any;
  tokensList?: UniswapToken[];
  jsonRpcUrlMap: { [chainId: number]: string[] };
  defaultTokenAddress: {
    input: string;
    output: string;
  };
  convenienceFee: {
    percentage: number;
    recipient: Record<number, string>;
  };
  routerURLs: {
    default: string;
  };
  connectWallet: () => Promise<boolean>;
};
