import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Includeable, Op, WhereOptions } from 'sequelize';
import { models } from '../database';
import { CommunityAttributes } from '../models';

export function GetCommunities(): Query<typeof schemas.GetCommunities> {
  return {
    ...schemas.GetCommunities,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      // TODO: constrain order_by
      const {
        base,
        tag_ids,
        include_node_info,
        stake_enabled,
        has_groups,
        cursor,
        limit,
        order_by,
        order_direction,
      } = payload;

      const includeOptions: Includeable[] = [];
      const whereOptions: WhereOptions<CommunityAttributes> = { active: true };

      // group configuration
      if (has_groups) {
        includeOptions.push({
          model: models.Group,
          as: 'groups',
          required: true,
        });
      }

      // tag configuration
      if (tag_ids && tag_ids.length > 0) {
        includeOptions.push({
          model: models.CommunityTags,
          include: [
            {
              model: models.Tags,
            },
          ],
          where: {
            tag_id: {
              [Op.in]: tag_ids,
            },
          },
          required: true,
        });
      } else {
        includeOptions.push({
          model: models.CommunityTags,
          include: [
            {
              model: models.Tags,
            },
          ],
        });
      }

      // stake configuration
      if (stake_enabled) {
        includeOptions.push({
          model: models.CommunityStake,
          where: { stakeEnabled: true },
          required: true,
        });
      } else {
        includeOptions.push({
          model: models.CommunityStake,
        });
      }

      // node configuration
      if (include_node_info) {
        includeOptions.push({
          model: models.ChainNode,
        });
      }

      // base configuration
      if (base) {
        whereOptions['base'] = base;
      }

      // query
      const offset = limit * (cursor - 1);
      const { rows: communities, count } =
        await models.Community.findAndCountAll({
          where: whereOptions,
          include: includeOptions,
          limit,
          offset,
          order: [[order_by, order_direction || 'ASC']],
        });

      return schemas.buildPaginatedResponse(communities, count, {
        limit,
        offset,
      });
    },
  };
}
