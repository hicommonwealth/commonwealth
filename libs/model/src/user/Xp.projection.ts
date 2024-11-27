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
  event_payload: { community_id: string; created_at?: Date },
  event_name: keyof typeof events,
) {
  const quest = await models.Quest.findOne({
    where: {
      community_id: event_payload.community_id,
      start_date: { [Op.lte]: event_payload.created_at },
      end_date: { [Op.gte]: event_payload.created_at },
    },
    include: [
      { required: true, model: models.QuestActionMeta, as: 'action_metas' },
    ],
  });
  if (!quest || !quest.action_metas) return;

  const action_metas = quest.get({ plain: true }).action_metas!;
  const action_meta = action_metas.find((a) => a.event_name === event_name);
  if (action_meta)
    return {
      ...action_meta,
      event_created_at: event_payload.created_at!,
    };
}

async function recordXps(
  user_id: number,
  action_meta: z.infer<typeof schemas.QuestActionMeta> & {
    event_created_at: Date;
  },
  creator_user_id?: number,
) {
  const creator_xp_points = creator_user_id
    ? Math.round(action_meta.reward_amount * action_meta.creator_reward_weight)
    : null;
  const xp_points = action_meta.reward_amount - (creator_xp_points ?? 0);

  // TODO: validate action participation limits by looking at the
  // actions log

  await sequelize.transaction(async (transaction) => {
    await models.XpLog.create(
      {
        event_name: action_meta.event_name,
        event_created_at: action_meta.event_created_at,
        user_id,
        xp_points,
        action_meta_id: action_meta.id,
        creator_user_id,
        creator_xp_points,
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
    if (creator_xp_points) {
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
        if (action_meta) await recordXps(user_id, action_meta);
      },
      CommentCreated: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const action_meta = await getQuestActionMeta(payload, 'CommentCreated');
        if (action_meta) await recordXps(user_id, action_meta);
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
          await recordXps(user_id, action_meta, comment!.Address!.user_id!);
      },
    },
  };
}
