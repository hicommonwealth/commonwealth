import { logger } from '@hicommonwealth/core';
import { WalletSsoSource } from '@hicommonwealth/shared';
import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { models, sequelize } from '../../database';
import { QuestActionMetaAttributes } from '../../models/quest';
import { GraphileTask, TaskPayloads } from '../graphileWorker';
import { getLikingUsers } from './api/getLikingUsers';
import { getReplies } from './api/getReplies';
import { getRetweets } from './api/getRetweets';
import { TwitterBotConfigs } from './twitter.config';

const log = logger(import.meta);

async function awardBatchTweetEngagementXp({
  action_meta,
  twitterUsernames,
  transaction,
}: {
  action_meta: QuestActionMetaAttributes;
  twitterUsernames: string[];
  transaction: Transaction;
}) {
  const addresses = await models.Address.findAll({
    attributes: ['id', 'user_id', 'oauth_username'],
    where: {
      user_id: {
        [Op.ne]: null,
      },
      oauth_provider: WalletSsoSource.Twitter,
      oauth_username: {
        [Op.in]: Array.from(new Set(twitterUsernames)),
      },
    },
  });

  const x =
    (action_meta.amount_multiplier ?? 0) > 0
      ? action_meta.amount_multiplier!
      : 1;
  const reward_amount = Math.round(action_meta.reward_amount * x);

  const now = new Date();
  await models.XpLog.bulkCreate(
    addresses.map((address) => ({
      user_id: address.user_id!,
      xp_points: reward_amount,
      action_meta_id: action_meta.id!,
      event_created_at: action_meta.created_at!,
      created_at: now,
    })),
    { transaction },
  );

  await models.User.update(
    {
      xp_points: sequelize.literal(`COALESCE(xp_points, 0) + ${reward_amount}`),
    },
    {
      where: {
        id: { [Op.in]: addresses.map((address) => address.user_id!) },
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

  if (quest.end_date > new Date()) {
    log.error(`Quest not ended yet: ${payload.quest_id}`);
    return;
  }

  if (quest.action_metas!.length > 1) {
    log.error(`Quest has multiple action metas: ${payload.quest_id}`);
  }
  const questTweet = models.QuestTweets.build(
    quest.action_metas![0].QuestTweet!,
  );

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
        action_meta: quest.action_metas![0],
        twitterUsernames: likes.map((like) => like.username),
        transaction,
      });
      questTweet.like_xp_awarded = true;
      await questTweet.save({ transaction });
    });
  }

  if (!awardedReplyXp && (payload.quest_ended || payload.reply_cap_reached)) {
    const replies = await getReplies({
      twitterBotConfig: TwitterBotConfigs.Common,
      tweetId: questTweet.tweet_id,
    });
    await models.sequelize.transaction(async (transaction) => {
      await awardBatchTweetEngagementXp({
        action_meta: quest.action_metas![0],
        twitterUsernames: replies
          .filter(
            (r) =>
              r.created_at < quest.end_date && r.created_at >= quest.start_date,
          )
          .map((reply) => reply.username),
        transaction,
      });
      questTweet.reply_xp_awarded = true;
      await questTweet.save({ transaction });
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
        action_meta: quest.action_metas![0],
        twitterUsernames: retweets.map((retweet) => retweet.username),
        transaction,
      });
      questTweet.retweet_xp_awarded = true;
      await questTweet.save({ transaction });
    });
  }
};

export const awardTweetEngagementXpTask: GraphileTask<
  typeof TaskPayloads.AwardTweetEngagementXp
> = {
  input: TaskPayloads.AwardTweetEngagementXp,
  fn: awardTweetEngagementXp,
};
