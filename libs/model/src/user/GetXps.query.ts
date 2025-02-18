import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { FindOptions, Op, WhereOptions } from 'sequelize';
import { models } from '../database';
import { XpLogInstance } from '../models/xp_log';

export function GetXps(): Query<typeof schemas.GetXps> {
  return {
    ...schemas.GetXps,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const { user_id, community_id, quest_id, from, to, event_name } = payload;

      const include: FindOptions['include'] = [
        {
          model: models.User,
          required: true,
          as: 'user',
          attributes: ['profile'],
        },
        {
          model: models.User,
          as: 'creator',
          required: false,
          attributes: ['profile'],
        },
        {
          model: models.QuestActionMeta,
          as: 'quest_action_meta',
          include: community_id
            ? [
                {
                  model: models.Quest,
                  required: true,
                  attributes: ['id', 'name'],
                  where: { community_id, ...(quest_id && { id: quest_id }) },
                },
              ]
            : [
                {
                  model: models.Quest,
                  required: true,
                  attributes: ['id', 'name'],
                  ...(quest_id && { where: { id: quest_id } }),
                },
              ],
        },
      ];

      const where: WhereOptions<XpLogInstance> = {};
      user_id && (where.user_id = user_id);
      event_name && (where.event_name = event_name);
      from && (where.created_at = { [Op.gt]: from });
      to && (where.created_at = { [Op.lte]: to });

      const xps = await models.XpLog.findAll({
        where,
        include,
        order: [['created_at', 'DESC']],
      });

      const finalXps = xps
        .map((xp) => {
          const { user, creator, quest_action_meta, ...rest } = xp.toJSON();
          return {
            ...rest,
            user_profile: user!.profile,
            creator_profile: creator?.profile,
            quest_id: quest_action_meta?.quest_id,
            quest_action_meta_id: quest_action_meta?.id,
          };
        })
        .filter((x) => x.quest_id);

      return finalXps;
    },
  };
}
