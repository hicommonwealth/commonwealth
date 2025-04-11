import { logger } from '@hicommonwealth/core';
import { XpLogName } from '@hicommonwealth/schemas';
import { WalletSsoSource } from '@hicommonwealth/shared';
import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { config } from '../../config';
import { models, sequelize } from '../../database';
import { QuestActionMetaAttributes, QuestAttributes } from '../../models/quest';
import { GraphileTask, TaskPayloads } from '../graphileWorker';
import { getLikingUsers } from './api/getLikingUsers';
import { getReplies } from './api/getReplies';
import { getRetweets } from './api/getRetweets';
import { TwitterBotConfigs } from './twitter.config';

const log = logger(import.meta, undefined, config.TWITTER.LOG_LEVEL);

async function awardBatchTweetEngagementXp({
  quest,
  action_meta,
  twitterUsernames,
  transaction,
  name,
}: {
  quest: QuestAttributes;
  action_meta: QuestActionMetaAttributes;
  twitterUsernames: string[];
  transaction: Transaction;
  name: z.infer<typeof XpLogName>;
}) {
  const addresses = await models.Address.findAll({
    attributes: [
      [sequelize.fn('DISTINCT', sequelize.col('user_id')), 'user_id'],
    ],
    where: {
      user_id: {
        [Op.ne]: null,
      },
      oauth_provider: WalletSsoSource.Twitter,
      oauth_username: {
        [Op.in]: Array.from(new Set(twitterUsernames)),
      },
      ...(quest.community_id ? { community_id: quest.community_id } : {}),
    },
  });
  const userIds = addresses.map((address) => address.user_id!);

  const x =
    (action_meta.amount_multiplier ?? 0) > 0
      ? action_meta.amount_multiplier!
      : 1;
  const reward_amount = Math.round(action_meta.reward_amount * x);

  const now = new Date();
  await models.XpLog.bulkCreate(
    userIds.map((userId) => ({
      user_id: userId!,
      xp_points: reward_amount,
      action_meta_id: action_meta.id!,
      event_created_at: action_meta.created_at!,
      created_at: now,
      name,
    })),
    { transaction },
  );
  log.trace(`Awarding ${reward_amount} xp to ${addresses.length} users`);

  await models.User.update(
    {
      xp_points: sequelize.literal(`COALESCE(xp_points, 0) + ${reward_amount}`),
    },
    {
      where: {
        id: { [Op.in]: userIds },
      },
      transaction,
    },
  );
}

export const awardTweetEngagementXp = async (
  payload: z.infer<typeof TaskPayloads.AwardTweetEngagementXp>,
) => {
  const quest = await models.Quest.findOne({
    where: {
      id: payload.quest_id,
    },
    include: [
      {
        model: models.QuestActionMeta,
        as: 'action_metas',
        required: true,
        include: [
          {
            model: models.QuestTweets,
            required: true,
          },
        ],
      },
    ],
  });

  if (!quest) {
    log.error(`Quest with QuestTweet not found: ${payload.quest_id}`);
    return;
  }

  if (quest.action_metas!.length > 1) {
    log.error(`Quest has multiple action metas: ${payload.quest_id}`);
  }
  const questTweet = quest.action_metas![0].QuestTweet!;

  const awardedLikeXp = questTweet.like_xp_awarded || questTweet.like_cap === 0;

  const awardedReplyXp =
    questTweet.reply_xp_awarded || questTweet.replies_cap === 0;

  const awardedRetweetXp =
    questTweet.retweet_xp_awarded || questTweet.retweet_cap === 0;

  if (awardedLikeXp && awardedReplyXp && awardedRetweetXp) {
    log.info(`Quest tweet already awarded xp: ${payload.quest_id}`, {
      quest_id: payload.quest_id,
      quest_tweet_id: questTweet.tweet_id,
    });
    return;
  }

  if (!awardedLikeXp && (payload.quest_ended || payload.like_cap_reached)) {
    const likes = await getLikingUsers({
      twitterBotConfig: TwitterBotConfigs.Common,
      tweetId: questTweet.tweet_id,
    });
    await models.sequelize.transaction(async (transaction) => {
      await awardBatchTweetEngagementXp({
        quest,
        action_meta: quest.action_metas![0],
        twitterUsernames: likes.map((like) => like.username),
        transaction,
        name: 'tweet_engagement_like',
      });
      questTweet.like_xp_awarded = true;
      await models.QuestTweets.update(
        {
          like_xp_awarded: true,
        },
        {
          where: {
            tweet_id: questTweet.tweet_id,
          },
          transaction,
        },
      );
    });
  }

  if (!awardedReplyXp && (payload.quest_ended || payload.reply_cap_reached)) {
    const replies = await getReplies({
      twitterBotConfig: TwitterBotConfigs.Common,
      tweetId: questTweet.tweet_id,
    });
    await models.sequelize.transaction(async (transaction) => {
      await awardBatchTweetEngagementXp({
        quest,
        action_meta: quest.action_metas![0],
        twitterUsernames: replies
          .filter(
            (r) =>
              r.created_at < quest.end_date && r.created_at >= quest.start_date,
          )
          .map((reply) => reply.username),
        transaction,
        name: 'tweet_engagement_reply',
      });
      questTweet.reply_xp_awarded = true;
      await models.QuestTweets.update(
        {
          reply_xp_awarded: true,
        },
        {
          where: {
            tweet_id: questTweet.tweet_id,
          },
          transaction,
        },
      );
    });
  }

  if (
    !awardedRetweetXp &&
    (payload.quest_ended || payload.retweet_cap_reached)
  ) {
    const retweets = await getRetweets({
      twitterBotConfig: TwitterBotConfigs.Common,
      tweetId: questTweet.tweet_id,
    });
    await models.sequelize.transaction(async (transaction) => {
      await awardBatchTweetEngagementXp({
        quest,
        action_meta: quest.action_metas![0],
        twitterUsernames: retweets.map((retweet) => retweet.username),
        transaction,
        name: 'tweet_engagement_retweet',
      });
      questTweet.retweet_xp_awarded = true;
      await models.QuestTweets.update(
        {
          retweet_xp_awarded: true,
        },
        {
          where: {
            tweet_id: questTweet.tweet_id,
          },
          transaction,
        },
      );
    });
  }
};

export const awardTweetEngagementXpTask: GraphileTask<
  typeof TaskPayloads.AwardTweetEngagementXp
> = {
  input: TaskPayloads.AwardTweetEngagementXp,
  fn: awardTweetEngagementXp,
};
