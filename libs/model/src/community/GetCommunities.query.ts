import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Includeable, Op } from 'sequelize';
import { models } from '../database';
import { CommunityTagsAttributes } from '../models';

export function GetCommunities(): Query<typeof schemas.GetCommunities> {
  return {
    ...schemas.GetCommunities,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
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

      // pagination configuration
      // TODO

      // query
      const communities = await models.Community.findAll({
        where: { active: true },
        include: includeOptions,
      });

      const communitiesResult: Array<typeof schemas.Community> =
        communities.map((c) => ({
          ...c.toJSON(),
          CommunityTags: (
            (c.CommunityTags || []) as CommunityTagsAttributes[]
          ).map((ct) => ({ id: ct!.Tag!.id, name: ct!.Tag!.name })),
        }));

      return schemas.buildPaginatedResponse(
        communitiesResult,
        0, // total results TODO
        {
          limit: 0, // TODO
          offset: 0, // TODO
        },
      );
    },
  };
}
