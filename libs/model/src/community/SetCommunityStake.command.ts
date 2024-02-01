import { CommandMetadata, InvalidInput } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { CommunityStakeAttributes } from '../models/community_stake';
import { validateCommunityStakeConfig } from '../services/commonProtocol';

const schema = z.object({
  stake_id: z.coerce.number().int(),
  stake_token: z.string().default(''),
  vote_weight: z.coerce.number().default(1),
  stake_enabled: z.coerce.boolean().default(true),
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
    if (!community) throw new InvalidInput('Community not found');

    // !here we can call domain, application, and infrastructure services (stateless, not related to entities or value objects)
    await validateCommunityStakeConfig(community, payload.stake_id);

    // !persist state mutations
    const [record] = await models.CommunityStake.upsert({
      ...payload,
      community_id: id,
    });

    // !response
    return record;
  },
};
