import {
  HotShotsStats,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { logger, stats } from '@hicommonwealth/core';
import { emitEvent, models } from '@hicommonwealth/model';
import { fileURLToPath } from 'url';
import { config } from '../../config';
import { getMentions } from './pollTwitter';
import {
  TwitterBotConfig,
  TwitterBotConfigs,
  createMentionEvents,
} from './utils';

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
