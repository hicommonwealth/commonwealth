import { z } from 'zod';
import { AuthContext } from '../context';
import { events } from '../events';
import { LaunchpadTradeView, TokenView } from '../queries';

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

export const CreateLaunchpadTrade = {
  input: z.object({
    eth_chain_id: z.number(),
    transaction_hash: z.string().length(66),
  }),
  output: LaunchpadTradeView.nullish(),
};

export const ProjectLaunchpadTrade = {
  input: events.LaunchpadTokenTraded,
  output: z.object({
    community_id: z.string().optional(),
  }),
};
