import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Includeable } from 'sequelize';
import { models } from '../database';

export function GetPinnedToken(): Query<typeof schemas.GetPinnedToken> {
  return {
    ...schemas.GetPinnedToken,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, with_chain_node } = payload;
      const include: Includeable[] = [];
      if (with_chain_node) {
        include.push({
          model: models.ChainNode,
          required: true,
        });
      }

      return await models.PinnedToken.findOne({
        where: {
          community_id,
        },
        include,
      });
    },
  };
}
