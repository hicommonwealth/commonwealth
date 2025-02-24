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

async function getUserByAddressId(address_id: number) {
  const addr = await models.Address.findOne({
    where: { id: address_id },
    attributes: ['user_id'],
  });
  return addr?.user_id ?? undefined;
}

async function getUserByAddress(address: string) {
  const addr = await models.Address.findOne({
    where: { address },
    attributes: ['user_id'],
  });
  return addr?.user_id ?? undefined;
}

/*
 * Finds all active quest action metas for a given event
 * - Global quests are not filtered by community
 * - Local quests are filtered by community
 */
async function getQuestActionMetas(
  event_payload: { community_id?: string; created_at?: Date },
  event_name: keyof typeof schemas.QuestEvents,
) {
  // make sure quest was active when event was created
  const quests = await models.Quest.findAll({
    where: {
      community_id: { [Op.or]: [null, event_payload.community_id ?? null] },
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
  content_id?: number, // thread or comment id
) {
  await sequelize.transaction(async (transaction) => {
    const creator_user_id = creator_address
      ? await getUserByAddress(creator_address)
      : undefined;

    for (const action_meta of action_metas) {
      if (!action_meta) continue;
      if (action_meta.content_id) {
        const parts = action_meta.content_id.split(':');
        if (parts.length !== 2) continue;
        if (parts[1] !== content_id?.toString()) continue;
      }

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
      const reward_amount = Math.round(
        action_meta.reward_amount * (action_meta.amount_multiplier ?? 1),
      );
      const creator_xp_points = creator_user_id
        ? Math.round(reward_amount * action_meta.creator_reward_weight)
        : undefined;
      const xp_points = reward_amount - (creator_xp_points ?? 0);

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
    const creator_user_id = creator_address
      ? await getUserByAddress(creator_address)
      : undefined;

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

        const referee_address = await models.User.findOne({
          where: { id: payload.user_id },
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
        const user = await models.User.findOne({
          where: { id: payload.user_id },
        });
        if (action_metas.length > 0) {
          await recordXpsForQuest(
            payload.user_id,
            payload.created_at!,
            action_metas,
            user?.referred_by_address,
          );
        }
      },
      ThreadCreated: async ({ payload }) => {
        const user_id = await getUserByAddressId(payload.address_id);
        if (!user_id) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'ThreadCreated',
        );
        await recordXpsForQuest(user_id, payload.created_at!, action_metas);
      },
      ThreadUpvoted: async ({ payload }) => {
        const user_id = await getUserByAddressId(payload.address_id);
        if (!user_id) return;
        const thread = await models.Thread.findOne({
          where: { id: payload.thread_id },
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
          payload,
          'ThreadUpvoted',
        );
        await recordXpsForQuest(
          user_id,
          payload.created_at!,
          action_metas,
          thread!.Address!.address,
          thread!.id,
        );
      },
      CommentCreated: async ({ payload }) => {
        const user_id = await getUserByAddressId(payload.address_id);
        if (!user_id) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'CommentCreated',
        );
        await recordXpsForQuest(user_id, payload.created_at!, action_metas);
      },
      CommentUpvoted: async ({ payload }) => {
        const user_id = await getUserByAddressId(payload.address_id);
        if (!user_id) return;
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
          comment!.id,
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
      RecurringContestManagerDeployed: async ({ payload }) => {
        const contest = await models.ContestManager.findOne({
          where: { contest_address: payload.contest_address },
          attributes: ['community_id', 'creator_address'],
        });
        if (!contest?.creator_address) return;
        const user_id = await getUserByAddress(contest.creator_address);
        if (!user_id) return;

        const action_metas = await getQuestActionMetas(
          {
            community_id: contest?.community_id,
            created_at: payload.created_at,
          },
          'RecurringContestManagerDeployed',
        );
        await recordXpsForQuest(user_id, payload.created_at!, action_metas);
      },
      OneOffContestManagerDeployed: async ({ payload }) => {
        const contest = await models.ContestManager.findOne({
          where: { contest_address: payload.contest_address },
          attributes: ['community_id', 'creator_address'],
        });
        if (!contest?.creator_address) return;
        const user_id = await getUserByAddress(contest.creator_address);
        if (!user_id) return;

        const action_metas = await getQuestActionMetas(
          {
            community_id: contest?.community_id,
            created_at: payload.created_at,
          },
          'OneOffContestManagerDeployed',
        );
        await recordXpsForQuest(user_id, payload.created_at!, action_metas);
      },
      LaunchpadTokenCreated: async ({ payload }) => {
        const created_at = new Date(Number(payload.block_timestamp));
        const action_metas = await getQuestActionMetas(
          { created_at },
          'LaunchpadTokenCreated',
        );
        const user_id = 0; // TODO: @kurtassad how we find user who launched the token?
        await recordXpsForQuest(user_id, created_at, action_metas);
      },
      LaunchpadTokenTraded: async ({ payload }) => {
        const user_id = await getUserByAddress(payload.trader_address);
        if (!user_id) return;

        const created_at = new Date(Number(payload.block_timestamp));
        const action_metas = await getQuestActionMetas(
          { created_at },
          'LaunchpadTokenTraded',
        );
        await recordXpsForQuest(user_id, created_at, action_metas);
      },
      CommonDiscordServerJoined: async ({ payload }) => {
        const action_metas = await getQuestActionMetas(
          { created_at: payload.joined_date },
          'CommonDiscordServerJoined',
        );
        await recordXpsForQuest(
          payload.user_id,
          payload.joined_date,
          action_metas,
        );
      },
    },
  };
}
