import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustExist } from '../middleware/guards';
import { commonProtocol } from '../services';

export function SetCommunityStake(): Command<
  typeof schemas.SetCommunityStake,
  AuthContext
> {
  return {
    ...schemas.SetCommunityStake,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const { id, ...rest } = payload;

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
      mustExist('Community', community);
      if (
        community.CommunityStakes &&
        community.CommunityStakes.find((s) => s.stake_id === rest.stake_id)
      )
        throw new InvalidState(
          `Stake ${rest.stake_id} already configured in community ${id}`,
        );

      // !domain, application, and infrastructure services (stateless, not related to entities or value objects)
      await commonProtocol.communityStakeConfigValidator.validateCommunityStakeConfig(
        community,
        rest.stake_id,
      );

      // !side effects
      const [updated] = await models.CommunityStake.upsert({
        ...rest,
        community_id: id.toString(),
      });

      return {
        ...community,
        CommunityStakes: [updated.toJSON()],
      };
    },
  };
}
