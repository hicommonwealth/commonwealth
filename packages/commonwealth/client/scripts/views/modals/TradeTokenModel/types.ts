import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { z } from 'zod';

export enum TradingMode {
  Buy = 'buy', // for trade on common
  Sell = 'sell', // for trade on common
  Swap = 'swap', // for trade via uniswap
}

export const TokenWithCommunity = TokenView.extend({
  community_id: z.string(),
});

export type TradingConfig = {
  mode: TradingMode;
  token: z.infer<typeof TokenWithCommunity>;
  addressType: ChainBase;
};

export type TradeTokenModalProps = {
  isOpen: boolean;
  onModalClose?: () => void;
  tradeConfig: TradingConfig;
};
