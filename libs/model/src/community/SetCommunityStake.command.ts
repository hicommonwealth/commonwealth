import { z } from 'zod';
import { models } from '../database';
import { InvalidInput } from '../errors';
import { isCommunityAdmin } from '../middleware';
import { CommunityStakeAttributes } from '../models/community_stake';
import { CommandMetadata } from '../types';

const schema = z.object({
  stake_id: z.coerce.number().int(),
  stake_token: z.string().optional(),
  stake_scaler: z.coerce.number().optional(),
  stake_enabled: z.coerce.boolean().optional(),
});

export type SetCommunityStake = z.infer<typeof schema>;

export const SetCommunityStake: CommandMetadata<
  typeof schema,
  CommunityStakeAttributes
> = {
  schema,
  middleware: [isCommunityAdmin],
  fn: async (actor, id, payload) => {
    const community = await models.Community.findOne({
      where: {
        id,
      },
      include: [
        {
          model: models.ChainNode,
          attributes: ['eth_chain_id', 'url'],
        },
      ],
      attributes: ['namespace'],
    });

    // check business rules - invariants
    // TODO: call community namespace validation service (common protocol)
    // - move tokenBalanceCache from /server/util to libs/model/util
    // - move commonProtocol from /server/util to libs/model/util
    if (!community?.ChainNode) throw new InvalidInput('Invalid community');

    // mutate the state
    const [record] = await models.CommunityStake.upsert({
      ...payload,
      community_id: id,
    });
    return record;
  },
};
