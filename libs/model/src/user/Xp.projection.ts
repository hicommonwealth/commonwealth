import { Projection, events } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { isWithinPeriod } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models, sequelize } from '../database';
import { mustExist } from '../middleware/guards';

const inputs = {
  CommunityJoined: events.CommunityJoined,
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

/*
 * Finds all active quest action metas for a given event
 */
async function getQuestActionMetas(
  event_payload: { community_id: string; created_at?: Date },
  event_name: keyof typeof events,
) {
  // make sure quest was active when event was created
  const quests = await models.Quest.findAll({
    where: {
      community_id: event_payload.community_id,
      start_date: { [Op.lte]: event_payload.created_at },
      end_date: { [Op.gte]: event_payload.created_at },
    },
    include: [
      { required: true, model: models.QuestActionMeta, as: 'action_metas' },
    ],
  });
  return quests.flatMap((q) =>
    q
      .get({ plain: true })
      .action_metas!.find((a) => a.event_name === event_name),
  );
}

async function recordXps(
  user_id: number,
  event_created_at: Date,
  action_metas: Array<z.infer<typeof schemas.QuestActionMeta> | undefined>,
  creator_user_id?: number,
) {
  await sequelize.transaction(async (transaction) => {
    for (const action_meta of action_metas) {
      if (!action_meta) continue;
      // get logged actions for this user and action meta
      const log = await models.XpLog.findAll({
        where: {
          user_id,
          event_name: action_meta.event_name,
          action_meta_id: action_meta.id,
        },
      });

      // validate action participation
      if (log.length > 0) {
        if (
          (action_meta.participation_limit ??
            QuestParticipationLimit.OncePerQuest) ===
          QuestParticipationLimit.OncePerQuest
        )
          // when participation_limit is once_per_quest, ignore after the first action
          continue;

        // participation_limit is once_per_period
        const tpp = action_meta.participation_times_per_period ?? 1;
        const period =
          action_meta.participation_period === QuestParticipationPeriod.Monthly
            ? 'month'
            : action_meta.participation_period ===
                QuestParticipationPeriod.Weekly
              ? 'week'
              : 'day';
        const actions_in_period = log.filter((l) =>
          isWithinPeriod(event_created_at, l.created_at, period),
        );
        if (actions_in_period.length >= tpp) continue;
      }

      // calculate xp points and log it
      const creator_xp_points = creator_user_id
        ? Math.round(
            action_meta.reward_amount * action_meta.creator_reward_weight,
          )
        : null;
      const xp_points = action_meta.reward_amount - (creator_xp_points ?? 0);

      const [, created] = await models.XpLog.findOrCreate({
        where: {
          user_id,
          event_name: action_meta.event_name,
          event_created_at,
        },
        defaults: {
          event_name: action_meta.event_name,
          event_created_at,
          user_id,
          xp_points,
          action_meta_id: action_meta.id,
          creator_user_id,
          creator_xp_points,
          created_at: new Date(),
        },
        transaction,
      });

      // accumulate xp points in user profiles
      if (created) {
        await models.User.update(
          {
            xp_points: sequelize.literal(
              `COALESCE(xp_points, 0) + ${xp_points}`,
            ),
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
      }
    }
  });
}

export function Xp(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityJoined: async ({ payload }) => {
        const action_metas = await getQuestActionMetas(
          payload,
          'CommunityJoined',
        );
        await recordXps(payload.user_id, payload.created_at!, action_metas);
      },
      ThreadCreated: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const action_metas = await getQuestActionMetas(
          payload,
          'ThreadCreated',
        );
        await recordXps(user_id, payload.created_at!, action_metas);
      },
      CommentCreated: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const action_metas = await getQuestActionMetas(
          payload,
          'CommentCreated',
        );
        await recordXps(user_id, payload.created_at!, action_metas);
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
        const action_metas = await getQuestActionMetas(
          {
            community_id: comment!.Thread!.community_id,
            created_at: payload.created_at,
          },
          'CommentUpvoted',
        );
        await recordXps(
          user_id,
          payload.created_at!,
          action_metas,
          comment!.Address!.user_id!,
        );
      },
    },
  };
}
