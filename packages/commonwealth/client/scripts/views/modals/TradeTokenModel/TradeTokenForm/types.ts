import { Token } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { SupportedCurrencies } from 'helpers/currency';
import { z } from 'zod';
import useTokenTradeForm from './useTokenTradeForm';

export enum TradingMode {
  Buy = 'buy',
  Sell = 'sell',
}

export type TradeTokenFormProps = ReturnType<typeof useTokenTradeForm>;

const TokenWithCommunity = Token.extend({ community_id: z.string() });

export type TradingConfig = {
  mode: TradingMode;
  token: z.infer<typeof TokenWithCommunity>;
  addressType: ChainBase;
};

export type UseTokenTradeFormProps = {
  tradeConfig: TradingConfig & {
    currency: SupportedCurrencies;
    presetAmounts?: number[];
  };
  addressType?: ChainBase;
  onTradeComplete?: () => void;
};
