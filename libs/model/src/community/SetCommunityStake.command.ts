import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';
import { commonProtocol } from '../services';

export const SetCommunityStake: Command<
  typeof schemas.SetCommunityStake
> = () => ({
  ...schemas.SetCommunityStake,
  auth: [isCommunityAdmin],
  body: async ({ id, payload }) => {
    // !load
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
    )?.toJSON();

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
    await commonProtocol.communityStakeConfigValidator.validateCommunityStakeConfig(
      community,
      payload.stake_id,
    );

    // !side effects
    const [updated] = await models.CommunityStake.upsert({
      ...payload,
      community_id: id!,
    });

    return {
      ...community,
      CommunityStakes: [updated.toJSON()],
    };
  },
});
