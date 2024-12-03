import { ExtendedCommunity, TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { SupportedCurrencies } from 'helpers/currency';
import NodeInfo from 'models/NodeInfo';
import { z } from 'zod';
import useTradeTokenForm from './useTradeTokenForm';

export enum TradingMode {
  Buy = 'buy',
  Sell = 'sell',
}

export const TokenWithCommunity = TokenView.extend({
  community_id: z.string(),
});

export type TradingConfig = {
  mode: TradingMode;
  token: z.infer<typeof TokenWithCommunity>;
  addressType: ChainBase;
};

export type TokenPresetAmounts = number | 'Max';

export type UseTradeTokenFormProps = {
  tradeConfig: TradingConfig & {
    currency: SupportedCurrencies;
    buyTokenPresetAmounts?: TokenPresetAmounts[];
    sellTokenPresetAmounts?: TokenPresetAmounts[]; // we could also do 25%, 50% etc
  };
  addressType?: ChainBase;
  onTradeComplete?: () => void;
};

export type UseBuyTradeProps = UseTradeTokenFormProps & {
  enabled: boolean;
  chainNode: NodeInfo;
  tokenCommunity?: z.infer<typeof ExtendedCommunity>;
  selectedAddress?: string;
  commonFeePercentage: number;
};

export type UseSellTradeProps = UseBuyTradeProps;

export type TradeTokenFormProps = ReturnType<typeof useTradeTokenForm>;

export type AddressBalanceProps = Pick<
  ReturnType<typeof useTradeTokenForm>,
  'trading' | 'addresses'
>;

export type BuyAmountSelectionProps = Pick<
  ReturnType<typeof useTradeTokenForm>,
  'trading'
>;

export type SellAmountSelectionProps = Pick<
  ReturnType<typeof useTradeTokenForm>,
  'trading'
>;

export type ReceiptDetailsProps = Pick<
  ReturnType<typeof useTradeTokenForm>,
  'trading'
>;
