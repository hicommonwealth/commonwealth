import { Projection, events } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models, sequelize } from '../database';
import { mustExist } from '../middleware/guards';

const inputs = {
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
  CommentUpvoted: events.CommentUpvoted,
  //PollCreated: events.PollCreated,
  //ThreadEdited: events.ThreadEdited,
  //CommentEdited: events.CommentEdited,
  //PollEdited: events.PollEdited,
};

async function getUserId(payload: { address_id: number }) {
  const address = await models.Address.findOne({
    where: { id: payload.address_id },
    attributes: ['user_id'],
  });
  mustExist('Address not found', address);
  return address.user_id!;
}

async function getQuestActionMeta(
  payload: { community_id: string; created_at?: Date },
  event_name: keyof typeof events,
) {
  const quest = await models.Quest.findOne({
    where: {
      community_id: payload.community_id,
      start_date: { [Op.lte]: payload.created_at },
      end_date: { [Op.gte]: payload.created_at },
    },
    include: [
      { required: true, model: models.QuestActionMeta, as: 'action_metas' },
    ],
  });
  if (!quest || !quest.action_metas) return;

  const action_metas = quest.get({ plain: true }).action_metas!;
  return action_metas.find((a) => a.event_name === event_name);
}

async function recordXps(
  user_id: number,
  creator_user_id: number,
  action_meta: z.infer<typeof schemas.QuestActionMeta>,
) {
  const creator_xp_points = Math.round(
    action_meta.reward_amount * action_meta.creator_reward_weight,
  );
  const xp_points = action_meta.reward_amount - creator_xp_points;

  // TODO: validate action participation limits

  // TODO: calculate author's share of quest reward
  // TODO: audit attributes in logs, including quest_id, action_meta_id, and
  // current user balances

  await sequelize.transaction(async (transaction) => {
    await models.XpLog.create(
      {
        user_id,
        event_name: action_meta.event_name,
        xp_points,
        // TODO: audit attributes
        // quest_id?: number,
        // action_meta_id?: number,
        // creator_xp_points?: number,
        // audit: string, // details at the moment of xp collection
        created_at: new Date(),
      },
      { transaction },
    );
    await models.User.update(
      {
        xp_points: sequelize.literal(`COALESCE(xp_points, 0) + ${xp_points}`),
      },
      {
        where: { id: user_id },
        transaction,
      },
    );
    if (creator_xp_points > 0) {
      await models.User.update(
        {
          xp_points: sequelize.literal(
            `COALESCE(xp_points, 0) + ${creator_xp_points}`,
          ),
        },
        {
          where: { id: creator_user_id },
          transaction,
        },
      );
    }
  });
}

export function Xp(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      ThreadCreated: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const action_meta = await getQuestActionMeta(payload, 'ThreadCreated');
        if (action_meta) await recordXps(user_id, user_id, action_meta);
      },
      CommentCreated: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const action_meta = await getQuestActionMeta(payload, 'CommentCreated');
        if (action_meta) await recordXps(user_id, user_id, action_meta);
      },
      CommentUpvoted: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const comment = await models.Comment.findOne({
          where: { id: payload.comment_id },
          include: [
            {
              model: models.Thread,
              attributes: ['community_id'],
              required: true,
            },
            {
              model: models.Address,
              as: 'Address',
              attributes: ['user_id'],
              required: true,
            },
          ],
        });
        const action_meta = await getQuestActionMeta(
          {
            community_id: comment!.Thread!.community_id,
            created_at: payload.created_at,
          },
          'CommentUpvoted',
        );
        if (action_meta)
          await recordXps(user_id, comment!.Address!.user_id!, action_meta);
      },
    },
  };
}
