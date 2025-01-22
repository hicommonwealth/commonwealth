import { Projection } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { isWithinPeriod } from '@hicommonwealth/shared';
import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { models, sequelize } from '../database';
import { mustExist } from '../middleware/guards';

async function getUserId(payload: { address_id: number }) {
  const address = await models.Address.findOne({
    where: { id: payload.address_id },
    attributes: ['user_id'],
  });
  mustExist('Address not found', address);
  return address.user_id!;
}

async function getUserIdByAddress(payload: {
  referrer_address?: string | null;
}): Promise<number | undefined> {
  if (payload.referrer_address) {
    const referrer_user = await models.Address.findOne({
      where: { address: payload.referrer_address },
      attributes: ['user_id'],
    });
    if (referrer_user) return referrer_user.user_id!;
  }
}

/*
 * Finds all active quest action metas for a given event
 */
async function getQuestActionMetas(
  event_payload: { community_id: string; created_at?: Date },
  event_name: keyof typeof schemas.QuestEvents,
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

async function addPointsToUsers(
  user_id: number,
  xp_points: number,
  transaction: Transaction,
  creator_user_id?: number,
  creator_xp_points?: number,
) {
  await models.User.update(
    { xp_points: sequelize.literal(`COALESCE(xp_points, 0) + ${xp_points}`) },
    { where: { id: user_id }, transaction },
  );
  if (creator_xp_points) {
    await models.User.update(
      {
        xp_points: sequelize.literal(
          `COALESCE(xp_points, 0) + ${creator_xp_points}`,
        ),
      },
      { where: { id: creator_user_id }, transaction },
    );
  }
}

async function recordXpsForQuest(
  user_id: number,
  event_created_at: Date,
  action_metas: Array<z.infer<typeof schemas.QuestActionMeta> | undefined>,
  creator_address?: string | null,
) {
  await sequelize.transaction(async (transaction) => {
    const creator_user_id = await getUserIdByAddress({
      referrer_address: creator_address,
    });

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
        : undefined;
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

      if (created)
        await addPointsToUsers(
          user_id,
          xp_points,
          transaction,
          creator_user_id,
          creator_xp_points,
        );
    }
  });
}

async function recordXpsForEvent(
  user_id: number,
  event_name: keyof typeof schemas.QuestEvents,
  event_created_at: Date,
  reward_amount: number,
  creator_address?: string, // referrer address
  creator_reward_weight?: number, // referrer reward weight
) {
  await sequelize.transaction(async (transaction) => {
    const creator_user_id = await getUserIdByAddress({
      referrer_address: creator_address,
    });

    // get logged actions for this user and event
    const log = await models.XpLog.findAll({
      where: { user_id, event_name },
    });
    if (log.length > 0) return; // already recorded

    // calculate xp points and log it
    const creator_xp_points = creator_user_id
      ? Math.round(reward_amount * (creator_reward_weight ?? 0))
      : undefined;
    const xp_points = reward_amount - (creator_xp_points ?? 0);

    const [, created] = await models.XpLog.findOrCreate({
      where: { user_id, event_name, event_created_at },
      defaults: {
        event_name,
        event_created_at,
        user_id,
        xp_points,
        creator_user_id,
        creator_xp_points,
        created_at: new Date(),
      },
      transaction,
    });

    if (created)
      await addPointsToUsers(
        user_id,
        xp_points,
        transaction,
        creator_user_id,
        creator_xp_points,
      );
  });
}

export function Xp(): Projection<typeof schemas.QuestEvents> {
  return {
    inputs: schemas.QuestEvents,
    body: {
      SignUpFlowCompleted: async ({ payload }) => {
        // TODO: softcode reward amount and reward weight in some way similar to quests
        const reward_amount = 20;
        const creator_reward_weight = 0.2;

        const referee_address = await models.Address.findOne({
          where: { address: payload.address, user_id: payload.user_id },
        });
        referee_address &&
          referee_address.referred_by_address &&
          (await recordXpsForEvent(
            payload.user_id,
            'SignUpFlowCompleted',
            payload.created_at!,
            reward_amount,
            referee_address.referred_by_address,
            creator_reward_weight,
          ));
      },
      CommunityCreated: async ({ payload }) => {
        const action_metas = await getQuestActionMetas(
          payload,
          'CommunityCreated',
        );
        if (action_metas.length > 0) {
          await recordXpsForQuest(
            payload.user_id,
            payload.created_at!,
            action_metas,
            payload.referrer_address,
          );
        }
      },
      CommunityJoined: async ({ payload }) => {
        const action_metas = await getQuestActionMetas(
          payload,
          'CommunityJoined',
        );
        if (action_metas.length > 0) {
          await recordXpsForQuest(
            payload.user_id,
            payload.created_at!,
            action_metas,
            payload.referrer_address,
          );
        }
      },
      ThreadCreated: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const action_metas = await getQuestActionMetas(
          payload,
          'ThreadCreated',
        );
        await recordXpsForQuest(user_id, payload.created_at!, action_metas);
      },
      ThreadUpvoted: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const action_metas = await getQuestActionMetas(
          payload,
          'ThreadUpvoted',
        );
        await recordXpsForQuest(user_id, payload.created_at!, action_metas);
      },
      CommentCreated: async ({ payload }) => {
        const user_id = await getUserId(payload);
        const action_metas = await getQuestActionMetas(
          payload,
          'CommentCreated',
        );
        await recordXpsForQuest(user_id, payload.created_at!, action_metas);
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
              attributes: ['address'],
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
        await recordXpsForQuest(
          user_id,
          payload.created_at!,
          action_metas,
          comment!.Address!.address,
        );
      },
      UserMentioned: async () => {
        // const user_id = await getUserId(payload);
        // const action_metas = await getQuestActionMetas(
        //   payload,
        //   'UserMentioned',
        // );
        // await recordXps(user_id, payload.created_at!, action_metas);
      },
    },
  };
}
