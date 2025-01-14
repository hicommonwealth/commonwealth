import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { z } from 'zod';
import { TradingMode } from '../types';

export const TokenWithCommunity = TokenView.extend({
  community_id: z.string(),
});

export type LaunchpadToken = z.infer<typeof TokenWithCommunity>;

export type CommonTradingConfig = {
  mode: TradingMode.Buy | TradingMode.Sell;
  token: LaunchpadToken;
  addressType: ChainBase;
};

export type CommonTradeTokenModalProps = {
  isOpen: boolean;
  onModalClose?: () => void;
  tradeConfig: CommonTradingConfig;
};
