import { Projection, events } from '@hicommonwealth/core';
import { Op } from 'sequelize';
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

async function getQuest(payload: { community_id: string; created_at?: Date }) {
  const quest = await models.Quest.findOne({
    where: {
      community_id: payload.community_id,
      start_date: { [Op.lte]: payload.created_at },
      end_date: { [Op.gte]: payload.created_at },
    },
  });
  return quest;
}

async function recordXps(
  event_name: keyof typeof inputs,
  user_id: number,
  xp_points: number,
  // TODO: audit attributes
  // quest_id?: number,
  // audit: string, // details at the moment of xp collection
) {
  await sequelize.transaction(async (transaction) => {
    await models.XpLog.create(
      {
        user_id,
        event_name,
        xp_points,
        created_at: new Date(),
      },
      { transaction },
    );
    await models.User.increment(['xp_points'], {
      by: xp_points,
      where: { id: user_id },
      transaction,
    });
  });
}

export function Xp(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      ThreadCreated: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const quest = await getQuest(payload);
        if (quest) {
          const xp_points = 10; // TODO: calculate points
          await recordXps('ThreadCreated', user_id, xp_points);
        }
      },
      CommentCreated: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const quest = await getQuest(payload);
        if (quest) {
          const xp_points = 10; // TODO: calculate points
          await recordXps('CommentCreated', user_id, xp_points);
        }
      },
      CommentUpvoted: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const comment = await models.Comment.findOne({
          where: { id: payload.comment_id },
          include: {
            model: models.Thread,
            attributes: ['community_id'],
            required: true,
          },
        });
        const quest = await getQuest({
          community_id: comment!.Thread!.community_id,
        });
        if (quest) {
          const xp_points = 10; // TODO: calculate points
          await recordXps('CommentUpvoted', user_id, xp_points);
        }
      },
    },
  };
}
