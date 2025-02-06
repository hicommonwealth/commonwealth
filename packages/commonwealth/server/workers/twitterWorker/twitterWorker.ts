import {
  HotShotsStats,
  RedisCache,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { CacheNamespaces, cache, logger, stats } from '@hicommonwealth/core';
import { fileURLToPath } from 'url';
import { config } from '../../config';
import { getMentions } from './pollTwitter';
import { TwitterBotConfig } from './utils';

const log = logger(import.meta);

stats({ adapter: HotShotsStats() });
config.CACHE.REDIS_URL &&
  cache({
    adapter: new RedisCache(config.CACHE.REDIS_URL),
  });

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: fileURLToPath(import.meta.url).endsWith(process.argv[1]),
  service: ServiceKey.TwitterWorker,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

async function pollMentions(twitterBotConfig: TwitterBotConfig) {
  try {
    const cachedStartTime = await cache().getKey(
      CacheNamespaces.Twitter_Poller,
      `${twitterBotConfig.twitterUserId}-mentions-poll-end-time`,
    );

    // Use cached end time or 10 minutes ago
    // TODO: check timezone
    const startTime = cachedStartTime
      ? new Date(cachedStartTime)
      : new Date(Date.now() - 1000 * 60 * 10);
    let endTime = new Date();

    log.info(
      `Fetching mentions between ${new Date(startTime).toISOString()} and ${new Date(endTime).toISOString()}`,
    );
    const mentions = await getMentions({
      twitterBotConfig,
      startTime,
      endTime,
    });

    // TODO: emit events
    // await emitEvent()

    await cache().setKey(
      CacheNamespaces.Twitter_Poller,
      `${twitterBotConfig.twitterUserId}-mentions-poll-end-time`,
      endTime.toISOString(),
    );

    log.info('Mentions polled successfully');
  } catch (error) {
    log.error('Error fetching mentions', error);
  }
}

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
  } catch (e) {
    isServiceHealthy = false;
    log.fatal('Twitter Worker setup failed', e);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main();
}
