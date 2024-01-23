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

// !command pattern
export const SetCommunityStake: CommandMetadata<
  // !command schema
  typeof schema,
  // !response type
  CommunityStakeAttributes
> = {
  // !command schema
  schema,
  // !authorization
  middleware: [isCommunityAdmin],
  // !core domain logic
  fn: async (id, payload) => {
    // !load aggregate by id
    const community = await models.Community.findOne({
      where: { id },
      include: [
        {
          model: models.ChainNode,
          attributes: ['eth_chain_id', 'url'],
        },
      ],
      attributes: ['namespace'],
    });

    // !check business rules - invariants on loaded state + payload
    // !here we can call domain, application, and infrastructure services (stateless, not related to entities or value objects)
    // TODO: call community namespace validation service (common protocol)
    // - move tokenBalanceCache domain service from /server/util to libs/model/services
    // - move commonProtocol domain service from /server/util to libs/model/services
    if (!community?.ChainNode) throw new InvalidInput('Invalid community');
    // await validateCommunityStakeConfig(community)

    // !persist state mutations
    const [record] = await models.CommunityStake.upsert({
      ...payload,
      community_id: id,
    });

    // !response
    return record;
  },
};
