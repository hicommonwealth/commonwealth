import { CommandMetadata, InvalidState } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';
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
  auth: [isCommunityAdmin],
  body: async ({ id, payload }) => {
    // !load
    const community = await models.Community.findOne({
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
    });

    // !domain logic - invariants on loaded state & payload
    if (!mustExist('Community', community)) return;
    if (
      community.CommunityStakes &&
      community.CommunityStakes.find((s) => s.stake_id === payload.stake_id)
    )
      throw new InvalidState(
        `Stake ${payload.stake_id} already configured in community ${id}`,
      );

    // !domain, application, and infrastructure services (stateless, not related to entities or value objects)
    await validateCommunityStakeConfig(community, payload.stake_id);

    // !side effects
    const [updated] = await models.CommunityStake.upsert({
      ...payload,
      community_id: id,
    });

    return {
      ...community.get({ plain: true }),
      CommunityStakes: [updated.get({ plain: true })],
    };
  },
};
