import { logger, Projection } from '@hicommonwealth/core';
import { getEvmAddress, getTransaction } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import {
  isWithinPeriod,
  UserTierMap,
  WalletSsoSource,
} from '@hicommonwealth/shared';
import { Op, Sequelize, Transaction } from 'sequelize';
import { z } from 'zod';
import { config } from '../../config';
import { models, sequelize } from '../../database';

const log = logger(import.meta);

async function getUserByAddressId(address_id: number) {
  const addr = await models.Address.findOne({
    where: { id: address_id },
    attributes: ['user_id'],
    include: [
      {
        model: models.User,
        attributes: ['id'],
        required: true,
        where: {
          tier: { [Op.ne]: UserTierMap.BannedUser },
        },
      },
    ],
  });
  return addr?.user_id ?? undefined;
}

async function getUserByAddress(address: string) {
  const addr = await models.Address.findOne({
    where: {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('address')),
          Sequelize.fn('LOWER', address),
        ),
        { user_id: { [Op.not]: null } },
      ],
    },
    attributes: ['user_id'],
    include: [
      {
        model: models.User,
        attributes: ['id'],
        required: true,
        where: { tier: { [Op.ne]: UserTierMap.BannedUser } },
      },
    ],
  });
  return addr?.user_id ?? undefined;
}

/*
 * Finds all active quest action metas for a given event
 */
async function getQuestActionMetas(
  event_payload: {
    community_id?: string;
    created_at?: Date;
    quest_action_meta_ids?: number[];
  },
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
        where: {
          event_name,
          ...(event_payload.quest_action_meta_ids && {
            id: event_payload.quest_action_meta_ids,
          }),
        },
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

async function recordXpsForQuest({
  event_id,
  user_id,
  event_created_at,
  action_metas,
  shared_with,
  scope,
}: {
  event_id: number;
  user_id: number;
  event_created_at: Date;
  action_metas: Array<z.infer<typeof schemas.QuestActionMeta> | undefined>;
  shared_with?: {
    creator_address?: string | null;
    referrer_address?: string | null;
  };
  scope?: z.infer<typeof schemas.QuestActionScope>;
}) {
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
          (scoped === 'threshold' && +id > (scope?.threshold || 0)) ||
          (scoped === 'discord_server_id' && id !== scope?.discord_server_id)
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
          event_id,
          user_id,
          action_meta_id: action_meta.id,
          event_created_at,
          xp_points,
          creator_user_id: shared_with_user_id,
          creator_xp_points: shared_xp_points,
          created_at: new Date(),
          scope,
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
      SignUpFlowCompleted: async ({ id, payload }) => {
        const referee_address = await models.User.findOne({
          where: {
            id: payload.user_id,
            tier: { [Op.ne]: UserTierMap.BannedUser },
          },
        });
        const action_metas = await getQuestActionMetas(
          payload,
          'SignUpFlowCompleted',
        );
        await recordXpsForQuest({
          event_id: id,
          user_id: payload.user_id,
          event_created_at: payload.created_at!,
          action_metas,
          shared_with: {
            referrer_address: referee_address?.referred_by_address,
          },
        });
      },
      CommunityCreated: async ({ id, payload }) => {
        const community = await models.Community.findOne({
          where: { id: payload.community_id },
        });
        if (!community) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'CommunityCreated',
        );
        if (action_metas.length > 0) {
          await recordXpsForQuest({
            event_id: id,
            user_id: payload.user_id,
            event_created_at: payload.created_at!,
            action_metas,
            shared_with: { referrer_address: payload.referrer_address },
            scope: {
              chain_id: community.chain_node_id || undefined,
              community_id: community.id,
            },
          });
        }
      },
      CommunityJoined: async ({ id, payload }) => {
        const action_metas = await getQuestActionMetas(
          payload,
          'CommunityJoined',
        );
        const user = await models.User.findOne({
          where: {
            id: payload.user_id,
            tier: { [Op.ne]: UserTierMap.BannedUser },
          },
        });
        if (action_metas.length > 0) {
          await recordXpsForQuest({
            event_id: id,
            user_id: payload.user_id,
            event_created_at: payload.created_at!,
            action_metas,
            shared_with: { referrer_address: user?.referred_by_address },
            scope: { community_id: payload.community_id },
          });
        }
      },
      ThreadCreated: async ({ id, payload }) => {
        const user_id = await getUserByAddressId(payload.address_id);
        if (!user_id) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'ThreadCreated',
        );
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: payload.created_at!,
          action_metas,
          scope: {
            community_id: payload.community_id,
            topic_id: payload.topic_id,
            thread_id: payload.id!,
          },
        });
      },
      ThreadUpvoted: async ({ id, payload }) => {
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
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: payload.created_at!,
          action_metas,
          shared_with: { creator_address: thread!.Address!.address },
          scope: {
            community_id: thread.community_id,
            topic_id: thread.topic_id,
            thread_id: thread.id!,
          },
        });
      },
      CommentCreated: async ({ id, payload }) => {
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
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: payload.created_at!,
          action_metas,
          scope: {
            community_id: thread.community_id,
            topic_id: thread.topic_id,
            thread_id: thread.id!,
            comment_id: payload.id!,
          },
        });
      },
      CommentUpvoted: async ({ id, payload }) => {
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
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: payload.created_at!,
          action_metas,
          shared_with: { creator_address: comment!.Address!.address },
          scope: {
            community_id: comment.Thread!.community_id,
            topic_id: comment.Thread!.topic_id,
            thread_id: comment.Thread!.id!,
            comment_id: comment.id,
          },
        });
      },
      UserMentioned: async () => {
        // const user_id = await getUserId(payload);
        // const action_metas = await getQuestActionMetas(
        //   payload,
        //   'UserMentioned',
        // );
        // await recordXps(user_id, payload.created_at!, action_metas);
      },
      RecurringContestManagerDeployed: async ({ id, payload }) => {
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
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: payload.created_at!,
          action_metas,
          scope: {
            community_id: contest.community_id,
            namespace: payload.namespace,
            contest_address: payload.contest_address,
          },
        });
      },
      OneOffContestManagerDeployed: async ({ id, payload }) => {
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
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: payload.created_at!,
          action_metas,
          scope: {
            community_id: contest.community_id,
            namespace: payload.namespace,
            contest_address: payload.contest_address,
          },
        });
      },
      ContestEnded: async ({ id, payload }) => {
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
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: payload.created_at!,
          action_metas,
          scope: {
            community_id: contest.community_id,
            contest_address: payload.contest_address,
            amount: total_prize,
          },
        });
      },
      LaunchpadTokenRecordCreated: async ({ id, payload }) => {
        const user_id = await getUserByAddress(payload.creator_address);
        config.LOG_XP_LAUNCHPAD &&
          log.info('Xp->LaunchpadTokenRecordCreated', { id, payload, user_id });
        if (!user_id) return;

        const created_at = payload.created_at;
        const action_metas = await getQuestActionMetas(
          { created_at },
          'LaunchpadTokenRecordCreated',
        );
        config.LOG_XP_LAUNCHPAD &&
          log.info('Xp->LaunchpadTokenRecordCreated', {
            id,
            payload,
            user_id,
            action_metas,
          });
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: created_at,
          action_metas,
          scope: {
            namespace: payload.namespace,
            launchpad_token_address: payload.token_address,
          },
        });
      },
      LaunchpadTokenTraded: async ({ id, payload }) => {
        const user_id = await getUserByAddress(payload.trader_address);
        config.LOG_XP_LAUNCHPAD &&
          log.info('Xp->LaunchpadTokenTraded', { id, payload, user_id });
        if (!user_id) return;

        const token = await models.LaunchpadToken.findOne({
          where: { token_address: payload.token_address.toLowerCase() },
        });
        config.LOG_XP_LAUNCHPAD &&
          log.info('Xp->LaunchpadTokenTraded', { id, payload, user_id, token });
        if (!token) return;

        const community = await models.Community.findOne({
          where: { namespace: token.namespace },
        });

        const created_at = new Date(Number(payload.block_timestamp) * 1000);
        const action_metas = await getQuestActionMetas(
          { community_id: community?.id, created_at },
          'LaunchpadTokenTraded',
        );

        // payload eth_amount is in wei, a little misleading
        const eth_amount = Number(payload.eth_amount) / 1e18;
        config.LOG_XP_LAUNCHPAD &&
          log.info('Xp->LaunchpadTokenTraded', {
            id,
            payload,
            user_id,
            created_at,
            action_metas,
            eth_amount,
          });
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: created_at,
          action_metas,
          scope: {
            community_id: community?.id,
            namespace: token.namespace,
            launchpad_token_address: payload.token_address,
            amount: eth_amount,
            threshold: eth_amount,
          },
        });
      },
      LaunchpadTokenGraduated: async ({ id, payload }) => {
        const user_id =
          payload.token.creator_address &&
          (await getUserByAddress(payload.token.creator_address));
        config.LOG_XP_LAUNCHPAD &&
          log.info('Xp->LaunchpadTokenGraduated', { id, payload, user_id });
        if (!user_id) return;

        const created_at = payload.token.updated_at
          ? new Date(payload.token.updated_at)
          : new Date();
        const action_metas = await getQuestActionMetas(
          { created_at },
          'LaunchpadTokenGraduated',
        );
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: created_at,
          action_metas,
          scope: {
            namespace: payload.token.namespace,
            launchpad_token_address: payload.token.token_address,
          },
        });
      },
      WalletLinked: async ({ id, payload }) => {
        const action_metas = await getQuestActionMetas(payload, 'WalletLinked');
        // TODO: use action meta attributes to determine denomination and conversion to XP,
        // at the moment we assume ETH (wei) denomination
        const threshold = Number(payload.balance);
        await recordXpsForQuest({
          event_id: id,
          user_id: payload.user_id,
          event_created_at: payload.created_at,
          action_metas,
          scope: {
            wallet: payload.wallet_id,
            threshold,
          },
        });
      },
      SSOLinked: async ({ id, payload }) => {
        const action_metas = await getQuestActionMetas(payload, 'SSOLinked');
        await recordXpsForQuest({
          event_id: id,
          user_id: payload.user_id,
          event_created_at: payload.created_at,
          action_metas,
          scope: { sso: payload.oauth_provider },
        });
      },
      NamespaceLinked: async ({ id, payload }) => {
        const address = await models.Address.findOne({
          where: { address: payload.deployer_address },
          attributes: ['user_id'],
        });
        if (!address) return;
        const action_metas = await getQuestActionMetas(
          payload,
          'NamespaceLinked',
        );
        await recordXpsForQuest({
          event_id: id,
          user_id: address.user_id!,
          event_created_at: payload.created_at,
          action_metas,
          scope: {
            community_id: payload.community_id,
            namespace: payload.namespace_address,
          },
        });
      },
      CommunityGoalReached: async ({ id, payload }) => {
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
        await recordXpsForQuest({
          event_id: id,
          user_id: address.user_id!,
          event_created_at: payload.created_at,
          action_metas,
          scope: {
            community_id: payload.community_id,
            goal_id: payload.community_goal_meta_id,
          },
        });
      },
      TwitterCommonMentioned: async ({ id, payload }) => {
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
        await recordXpsForQuest({
          event_id: id,
          user_id: address.user_id!,
          event_created_at: payload.created_at,
          action_metas,
        });
      },
      DiscordServerJoined: async ({ id, payload }) => {
        if (payload.user_id) {
          const action_metas = await getQuestActionMetas(
            { created_at: payload.joined_date },
            'DiscordServerJoined',
          );
          await recordXpsForQuest({
            event_id: id,
            user_id: payload.user_id,
            event_created_at: payload.joined_date,
            action_metas,
            scope: { discord_server_id: payload.server_id },
          });
        }
      },
      XpChainEventCreated: async ({ id, payload }) => {
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
        const action_metas = await getQuestActionMetas(
          payload,
          'XpChainEventCreated',
        );

        // should never happen
        if (action_metas.length > 1)
          throw new Error(
            'Too many action metas for XpChainEventCreated event',
          );

        if (action_metas.length === 0) return;
        await recordXpsForQuest({
          event_id: id,
          user_id,
          event_created_at: payload.created_at,
          action_metas,
        });
      },
      MembershipsRefreshed: async ({ id, payload }) => {
        const action_metas = await getQuestActionMetas(
          payload,
          'MembershipsRefreshed',
        );
        await Promise.all(
          payload.membership
            .filter((m) => !m.rejected)
            .map(async ({ user_id, group_id }) => {
              await recordXpsForQuest({
                event_id: id,
                user_id,
                event_created_at: payload.created_at,
                action_metas,
                scope: { community_id: payload.community_id, group_id },
              });
            }),
        );
      },
      XpAwarded: async ({ id, payload }) => {
        const user = await models.User.findOne({
          where: { id: payload.user_id },
        });
        if (!user) return;
        const action_metas = await getQuestActionMetas(payload, 'XpAwarded');
        await recordXpsForQuest({
          event_id: id,
          user_id: payload.user_id,
          event_created_at: payload.created_at,
          action_metas,
          scope: {
            amount: payload.xp_amount,
            award_reason: payload.reason,
            awarded_by_user_id: payload.by_user_id,
          },
        });
      },
    },
  };
}
