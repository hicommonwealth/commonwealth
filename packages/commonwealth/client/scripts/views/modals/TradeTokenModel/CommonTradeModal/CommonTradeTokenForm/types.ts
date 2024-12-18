import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { SupportedCurrencies } from 'helpers/currency';
import NodeInfo from 'models/NodeInfo';
import { z } from 'zod';
import { CommonTradingConfig } from '../types';
import useCommonTradeTokenFormProps from './useCommonTradeTokenForm';

export type TokenPresetAmounts = number | 'Max';

export type UseCommonTradeTokenFormProps = {
  tradeConfig: CommonTradingConfig & {
    currency: SupportedCurrencies;
    buyTokenPresetAmounts?: TokenPresetAmounts[];
    sellTokenPresetAmounts?: TokenPresetAmounts[]; // we could also do 25%, 50% etc
  };
  addressType?: ChainBase;
  onTradeComplete?: () => void;
};

export type UseBuyTradeProps = UseCommonTradeTokenFormProps & {
  enabled: boolean;
  chainNode: NodeInfo;
  tokenCommunity?: z.infer<typeof ExtendedCommunity>;
  selectedAddress?: string;
  commonFeePercentage: number;
};

export type UseSellTradeProps = UseBuyTradeProps;

export type CommonTradeTokenFormProps = ReturnType<
  typeof useCommonTradeTokenFormProps
>;

export type AddressBalanceProps = Pick<
  ReturnType<typeof useCommonTradeTokenFormProps>,
  'trading' | 'addresses'
>;

export type BuyAmountSelectionProps = Pick<
  ReturnType<typeof useCommonTradeTokenFormProps>,
  'trading'
>;

export type SellAmountSelectionProps = Pick<
  ReturnType<typeof useCommonTradeTokenFormProps>,
  'trading'
>;

export type ReceiptDetailsProps = Pick<
  ReturnType<typeof useCommonTradeTokenFormProps>,
  'trading'
>;
