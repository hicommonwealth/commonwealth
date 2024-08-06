import { InvalidState, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  FindAttributeOptions,
  Includeable,
  Op,
  OrderItem,
  WhereOptions,
  literal,
} from 'sequelize';
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
      if (
        order_by &&
        order_by !== 'profile_count' &&
        order_by !== 'thread_count'
      ) {
        throw new InvalidState(
          'Invalid ordering: must be profile_count or thread_count.',
        );
      }

      // TODO: this must be rewritten in SQL to support the intersection of tags
      const include: Includeable[] = [];
      const where: WhereOptions<CommunityAttributes & { tagCount: number }> = {
        active: true,
      };

      // group configuration
      if (has_groups) {
        include.push({
          model: models.Group,
          as: 'groups',
          required: true,
        });
      }

      // tag configuration
      // TODO: this needs to be an intersection, not a union
      if (tag_ids && tag_ids.length > 0) {
        include.push({
          model: models.CommunityTags,
          include: [
            {
              model: models.Tags,
            },
          ],
          where: {
            tag_id: tag_ids,
          },
          required: true,
        });
      } else {
        include.push({
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
        include.push({
          model: models.CommunityStake,
          where: { stakeEnabled: true },
          required: true,
        });
      } else {
        include.push({
          model: models.CommunityStake,
        });
      }

      // node configuration
      if (include_node_info) {
        include.push({
          model: models.ChainNode,
        });
      }

      // base configuration
      if (base) {
        where['base'] = base;
      }

      // pagination configuration
      const direction = order_direction || 'DESC';
      const order: OrderItem[] = [[order_by || 'profile_count', direction]];
      const offset = limit! * (cursor! - 1);

      const attributes: FindAttributeOptions = {
        include: [
          [
            literal(`(
              SELECT COUNT(*)
              FROM "CommunityTags" AS tag
              WHERE tag.community_id = "Community".id
            )`),
            'tagCount',
          ],
        ],
      };

      where['tagCount'] = {
        [Op.gte]: tag_ids!.length,
      };
      // execute query
      const { rows: communities, count } =
        await models.Community.findAndCountAll({
          distinct: true, // ensure correct count
          where,
          include,
          limit,
          offset,
          order,
          attributes,
        });
      console.log(communities, count);

      return schemas.buildPaginatedResponse(
        communities.map((c) => c.toJSON()),
        0,
        {
          limit,
          offset,
        },
      );
    },
  };
}
