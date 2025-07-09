import {
  HotShotsStats,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { composeSequelizeLogger, logger, stats } from '@hicommonwealth/core';
import {
  emitEvent,
  getMentions,
  getTweets,
  pgMultiRowUpdate,
  TwitterBotConfig,
  TwitterBotConfigs,
} from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { EventPair } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { fileURLToPath } from 'url';
import { config } from '../../config';
import { createMentionEvents } from './utils';

const log = logger(import.meta, undefined, config.TWITTER.LOG_LEVEL);

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
      ? new Date(Number(cachedStartTime.last_polled_timestamp))
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
          last_polled_timestamp: BigInt(res.endTime.getTime()),
        },
        { transaction },
      );
    });

    log.info('Mentions polled successfully');
  } catch (error) {
    log.error('Error fetching mentions', error);
  }
}

async function pollTweetMetrics(twitterBotConfig: TwitterBotConfig) {
  try {
    const quests = await models.Quest.findAll({
      where: {
        end_date: {
          [Op.gt]: new Date(),
        },
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
              where: {
                [Op.or]: [
                  {
                    [Op.and]: [
                      { like_xp_awarded: false },
                      { like_cap: { [Op.gt]: 0 } },
                    ],
                  },
                  {
                    [Op.and]: [
                      { reply_xp_awarded: false },
                      { replies_cap: { [Op.gt]: 0 } },
                    ],
                  },
                  {
                    [Op.and]: [
                      { retweet_xp_awarded: false },
                      { retweet_cap: { [Op.gt]: 0 } },
                    ],
                  },
                ],
              },
              // Rotates through tweets so that all tweets are updated eventually
              // even if we get rate limited occasionally
              order: [['updated_at', 'ASC']],
            },
          ],
        },
      ],
      logging: composeSequelizeLogger(log, config.TWITTER.LOG_LEVEL),
    });
    log.trace(`QuestTweets found ${quests.length}`);

    if (quests.length === 0) {
      log.trace('No quest tweets found');
      return;
    }
    const tweets = await getTweets({
      twitterBotConfig,
      tweetIds: quests.map((t) => t.action_metas![0].QuestTweet!.tweet_id),
    });
    const tweetUpdates: {
      num_likes: { newValue: number; whenCaseValue: string }[];
      num_replies: { newValue: number; whenCaseValue: string }[];
      num_retweets: { newValue: number; whenCaseValue: string }[];
    } = {
      num_likes: [],
      num_replies: [],
      num_retweets: [],
    };
    const capReachedEvents: EventPair<'TweetEngagementCapReached'>[] = [];

    for (const t of tweets) {
      log.trace(`Processing tweet ${t.id}`);
      const quest = quests.find(
        (q) => q.action_metas![0].QuestTweet!.tweet_id === t.id,
      )!;
      const queryTweet = quest.action_metas![0].QuestTweet;

      const capReachedEvent: EventPair<'TweetEngagementCapReached'> = {
        event_name: 'TweetEngagementCapReached',
        event_payload: {
          quest_id: quest.id!,
          quest_ended: false,
        },
      };

      if (!queryTweet) throw new Error('Tweet not found');

      if (
        queryTweet.like_cap !== 0 &&
        queryTweet.like_cap !== queryTweet.num_likes
      ) {
        const newValue =
          t.public_metrics.like_count >= queryTweet.like_cap!
            ? queryTweet.like_cap!
            : t.public_metrics.like_count;
        tweetUpdates.num_likes.push({
          newValue,
          whenCaseValue: `'${t.id}'`,
        });
        capReachedEvent.event_payload.like_cap_reached = true;
        log.trace(`Updating num_likes to ${newValue}`);
      }

      if (
        queryTweet.replies_cap !== 0 &&
        queryTweet.replies_cap !== queryTweet.num_replies
      ) {
        const newValue =
          t.public_metrics.reply_count >= queryTweet.replies_cap!
            ? queryTweet.replies_cap!
            : t.public_metrics.reply_count;
        tweetUpdates.num_replies.push({
          newValue,
          whenCaseValue: `'${t.id}'`,
        });
        capReachedEvent.event_payload.reply_cap_reached = true;
        log.trace(`Updating num_replies to ${newValue}`);
      }

      if (
        queryTweet.retweet_cap !== 0 &&
        queryTweet.retweet_cap !== queryTweet.num_retweets
      ) {
        const newValue =
          t.public_metrics.retweet_count >= queryTweet.retweet_cap!
            ? queryTweet.retweet_cap!
            : t.public_metrics.retweet_count;
        tweetUpdates.num_retweets.push({
          newValue,
          whenCaseValue: `'${t.id}'`,
        });
        capReachedEvent.event_payload.retweet_cap_reached = true;
        log.trace(`Updating num_retweets to ${newValue}`);
      }

      if (
        capReachedEvent.event_payload.like_cap_reached ||
        capReachedEvent.event_payload.reply_cap_reached ||
        capReachedEvent.event_payload.retweet_cap_reached
      ) {
        capReachedEvents.push(capReachedEvent);
      }
    }

    await models.sequelize.transaction(async (transaction) => {
      const questTweetsUpdated = await pgMultiRowUpdate(
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
        transaction,
      );
      questTweetsUpdated && log.info('Quest tweets updated');
      await emitEvent(models.Outbox, capReachedEvents, transaction);
    });
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
    log.info(`Mentions polling started`);

    await pollTweetMetrics(TwitterBotConfigs.Common);
    setInterval(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      pollTweetMetrics,
      config.TWITTER.WORKER_POLL_INTERVAL,
      TwitterBotConfigs.Common,
    );
    log.info(`Tweet metrics polling started`);
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
