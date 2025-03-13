import {
  HotShotsStats,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { logger, stats } from '@hicommonwealth/core';
import {
  emitEvent,
  getMentions,
  getTweets,
  models,
  pgMultiRowUpdate,
  TwitterBotConfig,
  TwitterBotConfigs,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { fileURLToPath } from 'url';
import { config } from '../../config';
import { createMentionEvents } from './utils';

const log = logger(import.meta);

stats({ adapter: HotShotsStats() });

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: fileURLToPath(import.meta.url).endsWith(process.argv[1]),
  service: ServiceKey.TwitterWorker,
  // eslint-disable-next-line @typescript-eslint/require-await
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

// 10 minutes ago
const DEFAULT_POLL_START_TIME = new Date(Date.now() - 1000 * 60 * 10);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function pollMentions(twitterBotConfig: TwitterBotConfig) {
  try {
    const cachedStartTime = await models.TwitterCursor.findOne({
      where: { bot_name: twitterBotConfig.name },
    });

    const startTime = cachedStartTime
      ? new Date(cachedStartTime.last_polled_timestamp)
      : DEFAULT_POLL_START_TIME;
    const endTime = new Date();

    log.info(
      `Fetching mentions between ${startTime.toISOString()} and ${endTime.toISOString()} for ${twitterBotConfig.name}`,
    );
    const res = await getMentions({
      twitterBotConfig,
      startTime,
      endTime,
    });

    await models.sequelize.transaction(async (transaction) => {
      await emitEvent(
        models.Outbox,
        createMentionEvents(twitterBotConfig, res.mentions),
        transaction,
      );
      await models.TwitterCursor.upsert(
        {
          bot_name: twitterBotConfig.name,
          last_polled_timestamp: res.endTime.getTime(),
        },
        { transaction },
      );
    });

    log.info('Mentions polled successfully');
  } catch (error) {
    log.error('Error fetching mentions', error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function pollTweetMetrics(twitterBotConfig: TwitterBotConfig) {
  try {
    const tweetsToQuery = await models.QuestTweets.findAll({
      where: {
        ended_at: null,
      },
      // Rotates through tweets so that all tweets are updated eventually
      // even if we get rate limited occasionally
      order: [['updated_at', 'ASC']],
      include: [
        {
          model: models.QuestActionMeta,
          required: true,
          include: [
            {
              model: models.Quest,
              required: true,
              where: {
                end_date: {
                  [Op.gt]: new Date(),
                },
              },
            },
          ],
        },
      ],
    });

    const tweets = await getTweets({
      twitterBotConfig,
      tweetIds: tweetsToQuery.map((t) => t.tweet_id),
    });
    const tweetUpdates: {
      num_likes: { newValue: number; whenCaseValue: string }[];
      num_replies: { newValue: number; whenCaseValue: string }[];
      num_retweets: { newValue: number; whenCaseValue: string }[];
      ended_at: { newValue: Date | null; whenCaseValue: string }[];
    } = {
      num_likes: [],
      num_replies: [],
      num_retweets: [],
      ended_at: [],
    };

    for (const t of tweets) {
      const queryTweet = tweetsToQuery.find((q) => q.tweet_id === t.id);
      if (!queryTweet) throw new Error('Tweet not found');

      const retweetCount =
        t.public_metrics.retweet_count + t.public_metrics.quote_count;

      tweetUpdates.num_likes.push({
        newValue:
          t.public_metrics.like_count >= queryTweet.like_cap!
            ? queryTweet.like_cap!
            : t.public_metrics.like_count,
        whenCaseValue: t.id,
      });

      tweetUpdates.num_replies.push({
        newValue:
          t.public_metrics.reply_count >= queryTweet.replies_cap!
            ? queryTweet.replies_cap!
            : t.public_metrics.reply_count,
        whenCaseValue: t.id,
      });
      tweetUpdates.num_retweets.push({
        newValue:
          retweetCount >= queryTweet.retweet_cap!
            ? queryTweet.retweet_cap!
            : retweetCount,
        whenCaseValue: t.id,
      });

      let endedAt: Date | null = null;

      if (
        t.public_metrics.like_count >= queryTweet.like_cap! &&
        t.public_metrics.reply_count >= queryTweet.replies_cap! &&
        retweetCount >= queryTweet.retweet_cap!
      ) {
        endedAt = new Date();
      }

      tweetUpdates.ended_at.push({
        newValue: endedAt,
        whenCaseValue: t.id,
      });
    }

    await pgMultiRowUpdate(
      'QuestTweets',
      [
        {
          setColumn: 'num_likes',
          rows: tweetUpdates.num_likes,
        },
        {
          setColumn: 'num_replies',
          rows: tweetUpdates.num_replies,
        },
        {
          setColumn: 'num_retweets',
          rows: tweetUpdates.num_retweets,
        },
      ],
      'tweet_id',
    );
  } catch (error) {
    log.error('Error fetching tweet metrics', error);
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  try {
    if (config.TWITTER.ENABLED_BOTS.length === 0) {
      log.info('No Twitter bots enabled. Exiting...');
      return;
    }

    if (config.TWITTER.WORKER_POLL_INTERVAL === 0) {
      log.info('Twitter Worker disabled. Exiting...');
      return;
    }

    log.info(
      `Starting Twitter Worker for bots: ${config.TWITTER.ENABLED_BOTS}`,
    );

    // TODO: run 15 minutes apart from each other?
    await Promise.allSettled(
      config.TWITTER.ENABLED_BOTS.map((n) =>
        pollMentions(TwitterBotConfigs[n]),
      ),
    );

    // schedule the next fetch runs equally distant from each other
    config.TWITTER.ENABLED_BOTS.forEach((n, i) => {
      setTimeout(
        () => {
          setInterval(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            pollMentions,
            config.TWITTER.WORKER_POLL_INTERVAL,
            TwitterBotConfigs[n],
          );
        },
        i *
          Math.round(
            config.TWITTER.WORKER_POLL_INTERVAL /
              config.TWITTER.ENABLED_BOTS.length,
          ),
      );
    });

    isServiceHealthy = true;
    log.info('Twitter Worker started');
  } catch (e) {
    isServiceHealthy = false;
    log.fatal('Twitter Worker setup failed', e);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main().catch((err) => {
    log.fatal(
      'Unknown error fatal requires immediate attention. Restart REQUIRED!',
      err,
    );
  });
}
