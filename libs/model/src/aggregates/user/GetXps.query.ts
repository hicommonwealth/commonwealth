import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { FindOptions, Op, WhereOptions } from 'sequelize';
import { models } from '../../database';
import { XpLogInstance } from '../../models/xp_log';

export function GetXps(): Query<typeof schemas.GetXps> {
  return {
    ...schemas.GetXps,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        user_id,
        user_or_creator_id,
        community_id,
        quest_id,
        from,
        to,
        event_name,
      } = payload;

      const include: FindOptions['include'] = [
        {
          model: models.User,
          required: true,
          as: 'user',
          attributes: ['profile', 'tier'],
        },
        {
          model: models.User,
          as: 'creator',
          required: false,
          attributes: ['profile', 'tier'],
        },
        {
          model: models.QuestActionMeta,
          as: 'quest_action_meta',
          required: true,
          where: event_name ? { event_name } : {},
          include: [
            {
              model: models.Quest,
              required: true,
              attributes: ['id', 'name'],
              where: {
                ...(community_id && { community_id }),
                ...(quest_id && { id: quest_id }),
              },
            },
          ],
        },
      ];

      const where: WhereOptions<XpLogInstance> = {};
      user_id && (where.user_id = user_id);
      from && (where.created_at = { [Op.gt]: from });
      to && (where.created_at = { [Op.lte]: to });

      const xps = await models.XpLog.findAll({
        where: {
          ...where,
          ...(user_or_creator_id && {
            [Op.or]: [
              { user_id: user_or_creator_id },
              { creator_user_id: user_or_creator_id },
            ],
          }),
        },
        include,
        order: [['created_at', 'DESC']],
        limit: 1000, // TODO: paginate this query, system quests are too big
      });

      const finalXps = xps
        .map((xp) => {
          const { user, creator, quest_action_meta, ...rest } = xp.toJSON();
          return {
            ...rest,
            user_profile: user!.profile,
            quest_id: quest_action_meta!.quest_id,
            quest_action_meta_id: quest_action_meta!.id!,
            event_name: quest_action_meta!.event_name,
            creator_profile: creator?.profile,
          };
        })
        .filter((x) => x.quest_id);

      return finalXps;
    },
  };
}
