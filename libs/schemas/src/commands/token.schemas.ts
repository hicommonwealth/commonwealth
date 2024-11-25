import { z } from 'zod';
import { AuthContext } from '../context';
import { LaunchpadTrade } from '../entities';
import { TokenView } from '../queries';

export const CreateToken = {
  input: z.object({
    transaction_hash: z.string().length(66),
    chain_node_id: z.number(),
    description: z.string().nullish(),
    icon_url: z.string().nullish(),
  }),
  output: TokenView,
  context: AuthContext,
};

export const LaunchpadTradeView = LaunchpadTrade.extend({
  community_token_amount: z.string(),
  floating_supply: z.string(),
});

export const CreateLaunchpadTrade = {
  input: z.object({
    eth_chain_id: z.number(),
    transaction_hash: z.string().length(66),
  }),
  output: LaunchpadTradeView,
};
