import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export const GetCommunityStake: Query<
  typeof schemas.GetCommunityStake
> = () => ({
  ...schemas.GetCommunityStake,
  auth: [],
  body: async ({ payload }) => {
    return (
      await models.CommunityStake.findOne({
        where: payload,
        include: [
          {
            model: models.Community,
            required: true,
            attributes: ['namespace'],
          },
        ],
      })
    )?.toJSON();
  },
});
