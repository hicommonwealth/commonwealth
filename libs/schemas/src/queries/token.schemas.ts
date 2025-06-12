import { z } from 'zod';
import { LaunchpadToken, LaunchpadTrade } from '../entities';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const TokenView = LaunchpadToken.extend({
  launchpad_liquidity: z.string(),
  latest_price: z.number().nullish(),
  old_price: z.number().nullish(),
});

export const GetTokens = {
  input: PaginationParamsSchema.extend({
    search: z.string().optional(),
    order_by: z.enum(['name', 'price', 'market_cap', 'created_at']).optional(),
    with_stats: z.boolean().optional(),
    is_graduated: z.boolean().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: TokenView.extend({ community_id: z.string() }).array(),
  }),
};

export const GetToken = {
  input: z
    .object({
      community_id: z.string().optional(),
      thread_id: z.number().optional(),
      with_stats: z.boolean().optional(),
    })
    .refine(
      (data) => data.community_id !== undefined || data.thread_id !== undefined,
      {
        message: 'Either community_id or thread_id must be provided',
      },
    ),
  output: z.union([TokenView, z.null()]),
};

export const LaunchpadTradeView = LaunchpadTrade.extend({
  community_token_amount: z.string(),
  floating_supply: z.string(),
});

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
    user_id: z.number().nullish(),
    user_name: z.string().nullish(),
    user_avatar_url: z.string().nullish(),
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
export const GetTokenStats = {
  input: z.object({ token_address: z.string() }),
  output: z.object({
    holder_count: z.number(),
    volume_24h: z.number(),
  }),
};
