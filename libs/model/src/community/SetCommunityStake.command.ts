import { CommandMetadata, InvalidInput } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { CommunityAttributes } from '../models';
import { validateCommunityStakeConfig } from '../services/commonProtocol/communityStakeConfigValidator';

const schema = z.object({
  stake_id: z.coerce.number().int(),
  stake_token: z.string().default(''),
  vote_weight: z.coerce.number().default(1),
  stake_enabled: z.coerce.boolean().default(true),
});

export type SetCommunityStake = z.infer<typeof schema>;

export const SetCommunityStake: CommandMetadata<
  CommunityAttributes,
  typeof schema
> = {
  schema,
  // !authorization and loading
  load: [isCommunityAdmin],

  // !core domain logic
  body: async ({ id, actor, payload }) => {
    const community = (
      await models.Community.findOne({
        where: { id },
        include: [
          {
            model: models.ChainNode,
            attributes: ['eth_chain_id', 'url'],
          },
          {
            model: models.CommunityStake,
          },
        ],
        attributes: ['namespace'],
      })
    )?.get({ plain: true });

    // !check business rules - invariants on loaded state + payload
    if (!community) throw new InvalidInput('Community not found');
    if (
      community.CommunityStakes &&
      community.CommunityStakes.find((s) => s.stake_id === payload.stake_id)
    )
      throw new InvalidInput(
        `Stake ${payload.stake_id} already configured in community ${id}`,
      );

    // !here we can call domain, application, and infrastructure services (stateless, not related to entities or value objects)
    await validateCommunityStakeConfig(community, payload.stake_id);

    return {
      id,
      actor,
      payload,
      state: community,
    };
  },

  // !persist state mutations
  save: async ({ id, actor, payload, state }) => {
    await models.CommunityStake.upsert({
      ...payload,
      community_id: id,
    });
    return {
      id,
      actor,
      payload,
      state: { ...state, CommunityStakes: [{ ...payload }] },
    };
  },
};
