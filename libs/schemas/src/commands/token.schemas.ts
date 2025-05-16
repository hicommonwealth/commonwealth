import { z } from 'zod';
import { AuthContext } from '../context';
import { LaunchpadTrade } from '../entities';
import { TokenView } from '../queries';

export const CreateToken = {
  input: z.object({
    community_id: z.string(),
    eth_chain_id: z.number(),
    transaction_hash: z.string().length(66),
    description: z.string().nullish(),
    icon_url: z.string().nullish(),
  }),
  output: TokenView.extend({
    community_id: z.string().nullish(),
    group_id: z.number().nullish(),
  }),
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
  output: LaunchpadTradeView.nullish(),
};

export const GetLaunchpadTrades = {
  input: z.object({
    token_address: z.string().optional(),
    trader_addresses: z.string().optional(),
  }),
  output: LaunchpadTrade.extend({
    community_token_amount: z.string(),
    floating_supply: z.string(),
    name: z.string(),
    symbol: z.string(),
    community_id: z.string(),
    community_icon_url: z.string(),
  }).array(),
};

export const GetTokenizedThreadsAllowed = {
  input: z.object({
    community_id: z.string(),
    topic_id: z.number(),
  }),
  output: z.object({
    tokenized_threads_enabled: z.boolean(),
    thread_purchase_token: z.string().nullish(),
  }),
};

export const GetTokenInfoAlchemy = {
  input: z.object({
    eth_chain_id: z.number(),
    token_address: z.string(),
  }),
  output: z.object({
    network: z.string(),
    address: z.string(),
    currency: z.string(),
    data: z
      .object({
        value: z.string(),
        timestamp: z.string(),
        marketCap: z.string(),
        totalVolume: z.string(),
      })
      .array(),
  }),
};
