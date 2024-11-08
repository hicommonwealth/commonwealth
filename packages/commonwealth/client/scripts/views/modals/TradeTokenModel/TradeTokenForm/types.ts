import { Token } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { SupportedCurrencies } from 'helpers/currency';
import { z } from 'zod';
import useTokenTradeForm from './useTokenTradeForm';

export enum TradingMode {
  Buy = 'buy',
  Sell = 'sell',
}

export type TradeTokenFormProps = {
  trading: { currency: SupportedCurrencies; presetAmounts?: number[] };
  addresses: {
    selected?: string;
    available: string[];
    default?: string;
    onChange: (address: string) => void;
  };
  onCTAClick: () => void;
} & Omit<
  // IMPORTANT: typescript won't give error if `useTokenTradeForm`
  // updates in future to not export the omitted properties here
  ReturnType<typeof useTokenTradeForm>,
  'addressDropdownListOptions' | 'userAddresses'
>;

export type TradingConfig = {
  mode: TradingMode;
  token: z.infer<typeof Token>;
  addressType: ChainBase;
};

export type UseTokenTradeFormProps = {
  tradeConfig: TradingConfig & { currency: SupportedCurrencies };
  addressType?: ChainBase;
};
