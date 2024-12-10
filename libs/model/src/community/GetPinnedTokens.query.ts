import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Includeable } from 'sequelize';
import { models } from '../database';

export function GetPinnedTokens(): Query<typeof schemas.GetPinnedTokens> {
  return {
    ...schemas.GetPinnedTokens,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_ids, with_chain_node } = payload;
      if (community_ids.length === 0) return [];
      const parsedIds = community_ids.split(',').filter((v) => v !== '');
      if (parsedIds.length === 0) return [];

      const include: Includeable[] = [];
      if (with_chain_node) {
        include.push({
          model: models.ChainNode,
          required: true,
        });
      }

      return (
        await models.PinnedToken.findAll({
          where: {
            community_id: parsedIds,
          },
          include,
        })
      ).map((t) => t.get({ plain: true }));
    },
  };
}
