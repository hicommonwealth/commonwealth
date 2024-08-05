import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Includeable } from 'sequelize';
import { models } from '../database';

export function GetCommunity(): Query<typeof schemas.GetCommunity> {
  return {
    ...schemas.GetCommunity,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const where = { id: payload.id };
      const include: Includeable[] = [];
      if (payload.include_node_info) {
        include.push({
          model: models.ChainNode,
          required: true,
          // TODO: attributes
        });
      }

      return (
        await models.Community.findOne({
          where,
          include,
        })
      )?.toJSON();
    },
  };
}
