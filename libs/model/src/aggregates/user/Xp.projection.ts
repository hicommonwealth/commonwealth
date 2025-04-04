import { Projection } from '@hicommonwealth/core';
import { getEvmAddress, getTransaction } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { WalletSsoSource, isWithinPeriod } from '@hicommonwealth/shared';
import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { models, sequelize } from '../../database';

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
 */
async function getQuestActionMetas(
  event_payload: { community_id?: string; created_at?: Date },
  event_name: keyof typeof schemas.QuestEvents,
) {
  // make sure quest was active when event was created
  const metas = await models.Quest.findAll({
    where: {
      community_id: { [Op.or]: [null, event_payload.community_id ?? null] },
      start_date: { [Op.lte]: event_payload.created_at },
      end_date: { [Op.gte]: event_payload.created_at },
    },
    include: [
      {
        required: true,
        model: models.QuestActionMeta,
        as: 'action_metas',
        where: { event_name },
      },
    ],
  });
  return metas.flatMap((q) => q.get({ plain: true }).action_metas);
}

async function accumulatePoints(
  quest_id: number,
  user_id: number,
  xp_points: number,
  transaction: Transaction,
  shared_user_id?: number,
  shared_xp_points?: number,
  is_referral?: boolean,
) {
  await models.User.update(
    { xp_points: sequelize.literal(`COALESCE(xp_points, 0) + ${xp_points}`) },
    { where: { id: user_id }, transaction },
  );
  if (shared_xp_points) {
    await models.User.update(
      {
        xp_points: sequelize.literal(
          `COALESCE(xp_points, 0) + ${is_referral ? 0 : shared_xp_points}`,
        ),
        xp_referrer_points: sequelize.literal(
          `COALESCE(xp_referrer_points, 0) + ${is_referral ? shared_xp_points : 0}`,
        ),
      },
      { where: { id: shared_user_id }, transaction },
    );
  }
  // update xp_awarded and end quest if max_xp_to_end is reached
  const xp_awarded = xp_points + (shared_xp_points || 0);
  await models.Quest.update(
    {
      xp_awarded: sequelize.literal(`xp_awarded + ${xp_awarded}`),
      end_date: sequelize.literal(`
        CASE WHEN (xp_awarded + ${xp_awarded}) >= max_xp_to_end
        THEN NOW()
        ELSE end_date
        END
      `),
    },
    { where: { id: quest_id }, transaction },
  );
}

async function recordXpsForQuest(
  user_id: number,
  event_created_at: Date,
  action_metas: Array<z.infer<typeof schemas.QuestActionMeta> | undefined>,
  shared_with?: {
    creator_address?: string | null;
    referrer_address?: string | null;
  },
  scope?: {
    chain_id?: number;
    topic_id?: number;
    thread_id?: number;
    comment_id?: number;
    group_id?: number;
    wallet?: string;
    sso?: string;
    amount?: number; // overrides reward_amount if present, used with trades x multiplier
    goal_id?: number; // community goals
    threshold?: number; // rewards when threshold over configured meta value
  },
) {
  const shared_with_address =
    shared_with?.creator_address || shared_with?.referrer_address;
  await sequelize.transaction(async (transaction) => {
    const shared_with_user_id = shared_with_address
      ? await getUserByAddress(shared_with_address)
      : undefined;

    for (const action_meta of action_metas) {
      if (!action_meta?.id) continue;
      if (action_meta.content_id) {
        const [scoped, id] = action_meta.content_id.split(':');
        if (!scoped || !id) continue; // this shouldn't happen, but just in case
        if (
          (scoped === 'chain' && +id !== scope?.chain_id) ||
          (scoped === 'topic' && +id !== scope?.topic_id) ||
          (scoped === 'thread' && +id !== scope?.thread_id) ||
          (scoped === 'comment' && +id !== scope?.comment_id) ||
          (scoped === 'group' && +id !== scope?.group_id) ||
          (scoped === 'wallet' && id !== scope?.wallet) ||
          (scoped === 'sso' && id !== scope?.sso) ||
          (scoped === 'goal' && +id !== scope?.goal_id) ||
          (scoped === 'threshold' && +id > (scope?.threshold || 0))
        )
          continue;
      }

      // get logged actions for this user and action meta
      const log = await models.XpLog.findAll({
        where: { user_id, action_meta_id: action_meta.id },
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
      const x =
        (action_meta.amount_multiplier ?? 0) > 0
          ? action_meta.amount_multiplier!
          : 1;
      const reward_amount = Math.round(
        (scope?.amount || action_meta.reward_amount) * x,
      );
      const shared_xp_points = shared_with_user_id
        ? Math.round(reward_amount * action_meta.creator_reward_weight)
        : undefined;
      const xp_points = reward_amount - (shared_xp_points ?? 0);

      const [, created] = await models.XpLog.findOrCreate({
        where: {
          user_id,
          action_meta_id: action_meta.id,
          event_created_at,
        },
        defaults: {
          user_id,
          action_meta_id: action_meta.id,
          event_created_at,
          xp_points,
          creator_user_id: shared_with_user_id,
          creator_xp_points: shared_xp_points,
          created_at: new Date(),
        },
        transaction,
      });

      if (created)
        await accumulatePoints(
          action_meta.quest_id,
          user_id,
          xp_points,
          transaction,
          shared_with_user_id,
          shared_xp_points,
          !!shared_with?.referrer_address,
        );
    }
  });
}

export function Xp(): Projection<typeof schemas.QuestEvents> {
  return {
    inputs: schemas.QuestEvents,
    body: {
      SignUpFlowCompleted: async ({ payload }) => {
        const referee_address = await models.User.findOne({
          where: { id: payload.user_id },
        });
        const action_metas = await getQuestActionMetas(
          payload,
          'SignUpFlowCompleted',
        );
        await recordXpsForQuest(
          payload.user_id,
          payload.created_at!,
          action_metas,
          { referrer_address: referee_address?.referred_by_address },
        );
      },
      CommunityCreated: async ({ payload }) => {
        const community = await models.Community.findOne({
          where: { id: payload.community_id },
        });
        if (!community) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'CommunityCreated',
        );
        if (action_metas.length > 0) {
          await recordXpsForQuest(
            payload.user_id,
            payload.created_at!,
            action_metas,
            { referrer_address: payload.referrer_address },
            { chain_id: community.chain_node_id || undefined },
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
            { referrer_address: user?.referred_by_address },
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
        await recordXpsForQuest(
          user_id,
          payload.created_at!,
          action_metas,
          undefined,
          {
            topic_id: payload.topic_id,
            thread_id: payload.id!,
          },
        );
      },
      ThreadUpvoted: async ({ payload }) => {
        const user_id = await getUserByAddressId(payload.address_id);
        if (!user_id) return;
        const thread = await models.Thread.findOne({
          where: { id: payload.thread_id },
          include: [
            {
              model: models.Address,
              as: 'Address',
              attributes: ['address'],
              required: true,
            },
          ],
        });
        if (!thread) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'ThreadUpvoted',
        );
        await recordXpsForQuest(
          user_id,
          payload.created_at!,
          action_metas,
          { creator_address: thread!.Address!.address },
          { topic_id: thread.topic_id, thread_id: thread.id! },
        );
      },
      CommentCreated: async ({ payload }) => {
        const user_id = await getUserByAddressId(payload.address_id);
        if (!user_id) return;
        const thread = await models.Thread.findOne({
          where: { id: payload.thread_id },
        });
        if (!thread) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'CommentCreated',
        );
        await recordXpsForQuest(
          user_id,
          payload.created_at!,
          action_metas,
          undefined,
          {
            topic_id: thread.topic_id,
            thread_id: thread.id!,
          },
        );
      },
      CommentUpvoted: async ({ payload }) => {
        const user_id = await getUserByAddressId(payload.address_id);
        if (!user_id) return;
        const comment = await models.Comment.findOne({
          where: { id: payload.comment_id },
          include: [
            {
              model: models.Thread,
              attributes: ['id', 'community_id', 'topic_id'],
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
        if (!comment) return;
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
          { creator_address: comment!.Address!.address },
          {
            topic_id: comment.Thread!.topic_id,
            thread_id: comment.Thread!.id!,
            comment_id: comment.id,
          },
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
      ContestEnded: async ({ payload }) => {
        const contest = await models.ContestManager.findOne({
          where: { contest_address: payload.contest_address },
          attributes: ['community_id', 'creator_address'],
        });
        if (!contest?.creator_address) return;

        // make sure contest was funded
        const total_prize = payload.winners.reduce(
          (prize, winner) => prize + Number(winner.prize),
          0,
        );
        if (total_prize <= 0) return;

        const user_id = await getUserByAddress(contest.creator_address);
        if (!user_id) return;

        const action_metas = await getQuestActionMetas(
          {
            community_id: contest?.community_id,
            created_at: payload.created_at,
          },
          'ContestEnded',
        );
        await recordXpsForQuest(
          user_id,
          payload.created_at!,
          action_metas,
          undefined,
          { amount: total_prize },
        );
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
        await recordXpsForQuest(user_id, created_at, action_metas, undefined, {
          amount: Number(payload.eth_amount),
        });
      },
      WalletLinked: async ({ payload }) => {
        const action_metas = await getQuestActionMetas(payload, 'WalletLinked');
        // TODO: use action meta attributes to determine denomination and conversion to XP,
        // at the moment we assume ETH (wei) denomination
        const threshold = Number(payload.balance);
        await recordXpsForQuest(
          payload.user_id,
          payload.created_at,
          action_metas,
          undefined,
          {
            wallet: payload.wallet_id,
            threshold,
          },
        );
      },
      SSOLinked: async ({ payload }) => {
        const action_metas = await getQuestActionMetas(payload, 'SSOLinked');
        await recordXpsForQuest(
          payload.user_id,
          payload.created_at,
          action_metas,
          undefined,
          { sso: payload.oauth_provider },
        );
      },
      NamespaceLinked: async ({ payload }) => {
        const address = await models.Address.findOne({
          where: { address: payload.deployer_address },
          attributes: ['user_id'],
        });
        if (!address) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'NamespaceLinked',
        );
        await recordXpsForQuest(
          address.user_id!,
          payload.created_at,
          action_metas,
        );
      },
      CommunityGoalReached: async ({ payload }) => {
        // find the admin of the community (TODO: project on community creation, using proxy in the meantime)
        const address = await models.Address.findOne({
          where: { community_id: payload.community_id, role: 'admin' },
          order: ['created_at'],
        });
        if (!address) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'CommunityGoalReached',
        );
        await recordXpsForQuest(
          address.user_id!,
          payload.created_at,
          action_metas,
          undefined,
          { goal_id: payload.community_goal_meta_id },
        );
      },
      TwitterCommonMentioned: async ({ payload }) => {
        const address = await models.Address.findOne({
          where: {
            oauth_provider: WalletSsoSource.Twitter,
            oauth_username: payload.username,
          },
        });
        if (!address) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'TwitterCommonMentioned',
        );
        await recordXpsForQuest(
          address.user_id!,
          payload.created_at,
          action_metas,
        );
      },
      CommonDiscordServerJoined: async ({ payload }) => {
        if (payload.user_id) {
          const action_metas = await getQuestActionMetas(
            { created_at: payload.joined_date },
            'CommonDiscordServerJoined',
          );
          await recordXpsForQuest(
            payload.user_id,
            payload.joined_date,
            action_metas,
          );
        }
      },
      XpChainEventCreated: async ({ payload }) => {
        const chainNode = await models.ChainNode.scope(
          'withPrivateData',
        ).findOne({
          where: {
            eth_chain_id: payload.eth_chain_id,
          },
        });
        if (!chainNode) return;
        const { tx } = await getTransaction({
          rpc: chainNode.private_url || chainNode.url,
          txHash: payload.transaction_hash,
        });
        const user_id = await getUserByAddress(getEvmAddress(tx.from));
        if (!user_id) return;
        const action_meta = await models.QuestActionMeta.findOne({
          where: {
            id: payload.quest_action_meta_id,
          },
        });
        if (!action_meta) return;
        await recordXpsForQuest(user_id, payload.created_at, [action_meta]);
      },
      MembershipsRefreshed: async ({ payload }) => {
        const action_metas = await getQuestActionMetas(
          payload,
          'MembershipsRefreshed',
        );
        await Promise.all(
          payload.membership
            .filter((m) => !m.rejected)
            .map(async ({ user_id, group_id }) => {
              await recordXpsForQuest(
                user_id,
                payload.created_at,
                action_metas,
                undefined,
                { group_id },
              );
            }),
        );
      },
    },
  };
}
