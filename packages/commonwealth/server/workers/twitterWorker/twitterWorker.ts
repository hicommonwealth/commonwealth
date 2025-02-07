import {
  HotShotsStats,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { logger, stats } from '@hicommonwealth/core';
import { emitEvent, models } from '@hicommonwealth/model';
import { fileURLToPath } from 'url';
import { getMentions } from './pollTwitter';
import { TwitterBotConfig, createMentionEvents } from './utils';

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
      `Fetching mentions between ${new Date(startTime).toISOString()} and ${new Date(endTime).toISOString()}`,
    );
    const mentions = await getMentions({
      twitterBotConfig,
      startTime,
      endTime,
    });

    await models.sequelize.transaction(async (transaction) => {
      await emitEvent(
        models.Outbox,
        createMentionEvents(twitterBotConfig, mentions),
        transaction,
      );
      await models.TwitterCursor.upsert({
        bot_name: twitterBotConfig.name,
        last_polled_timestamp: endTime.getTime(),
      });
    });

    log.info('Mentions polled successfully');
  } catch (error) {
    log.error('Error fetching mentions', error);
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  try {
    log.info('Starting Twitter Worker...');

    // TODO: schedule mention polling such that they do not happen
    //  concurrently and do not go over the rate limit
    // await Promise.allSettled([
    //   pollMentions(TwitterBotConfigs.MomBot),
    //   pollMentions(TwitterBotConfigs.ContestBot),
    // ]);
    // setInterval(pollMentions, 1000, TwitterBotConfigs.MomBot)
    // setInterval(pollMentions, 1000, TwitterBotConfigs.ContestBot)
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
