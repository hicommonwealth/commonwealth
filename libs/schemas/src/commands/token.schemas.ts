import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { EVM_ADDRESS_STRICT } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { AuthContext } from '../context';
import { LaunchpadTrade } from '../entities';
import { TokenView } from '../queries';

export const CreateToken = {
  input: z.object({
    community_id: z.string(),
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

export const GetLaunchpadTrades = {
  input: z.object({
    token_address: z.string(),
  }),
  output: LaunchpadTrade.extend({
    community_token_amount: z.string(),
    floating_supply: z.string(),
  })
    .array()
    .nullish(),
};

export const DistributeSkale = {
  input: z.object({
    address: EVM_ADDRESS_STRICT,
    // TODO: When we get support for the mainnet skale chain, replace with this
    // eth_chain_id: z.union([z.literal(cp.ValidChains.SKALE_TEST), z.literal(cp.ValidChains.SKALE)])
    eth_chain_id: z.literal(cp.ValidChains.SKALE_TEST),
  }),
  output: LaunchpadTrade.extend({
    community_token_amount: z.string(),
    floating_supply: z.string(),
  })
    .array()
    .nullish(),
};
