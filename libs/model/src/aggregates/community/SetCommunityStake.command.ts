import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { communityStakeConfigValidator } from '../../services/commonProtocol';

export function SetCommunityStake(): Command<typeof schemas.SetCommunityStake> {
  return {
    ...schemas.SetCommunityStake,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, ...rest } = payload;

      // !load
      const community = (
        await models.Community.findOne({
          where: { id: community_id },
          include: [
            {
              model: models.ChainNode,
              attributes: ['eth_chain_id', 'url'],
            },
            { model: models.CommunityStake },
          ],
        })
      )?.toJSON();
      mustExist('Community', community);

      // !domain logic - invariants on loaded state & payload
      if (
        community.CommunityStakes &&
        community.CommunityStakes.find((s) => s.stake_id === rest.stake_id)
      )
        throw new InvalidState('Community stake already configured');

      // !domain, application, and infrastructure services (stateless, not related to entities or value objects)
      await communityStakeConfigValidator.validateCommunityStakeConfig(
        community,
        rest.stake_id,
      );

      // !side effects
      const [updated] = await models.CommunityStake.upsert({
        ...rest,
        community_id,
      });

      return {
        ...community,
        CommunityStakes: [updated.toJSON()],
      };
    },
  };
}
