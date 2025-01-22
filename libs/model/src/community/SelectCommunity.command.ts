import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../database';

export const SelectCommunityErrors = {
  CommunityNotFound: 'Community not found',
};

export function SelectCommunity(): Command<typeof schemas.SelectCommunity> {
  return {
    ...schemas.SelectCommunity,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      const { community_id } = payload;

      const community = await models.Community.findOne({
        where: { id: community_id },
        attributes: ['id'],
      });
      if (!community)
        throw new InvalidInput(SelectCommunityErrors.CommunityNotFound);

      await models.User.update(
        { selected_community_id: community_id },
        {
          where: {
            id: actor.user.id,
            selected_community_id: { [Op.ne]: community_id },
          },
        },
      );

      return {};
    },
  };
}
