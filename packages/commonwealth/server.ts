import {
  HotShotsStats,
  KnockProvider,
  MixpanelAnalytics,
  RedisCache,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  analytics,
  cache,
  logger,
  notificationsProvider,
  stats,
} from '@hicommonwealth/core';
import express from 'express';
import { fileURLToPath } from 'url';
import { config } from './server/config';
import { DatabaseCleaner } from './server/util/databaseCleaner';

// handle exceptions thrown in express routes
import 'express-async-errors';
import { performContestRollovers } from 'node_modules/@hicommonwealth/model/src/contest';

// bootstrap production adapters
const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
stats(HotShotsStats());
analytics(MixpanelAnalytics());
config.CACHE.REDIS_URL && cache(new RedisCache(config.CACHE.REDIS_URL));

if (config.NOTIFICATIONS.FLAG_KNOCK_INTEGRATION_ENABLED)
  notificationsProvider(KnockProvider());
else notificationsProvider();

let isServiceHealthy = false;
startHealthCheckLoop({
  service: ServiceKey.Commonwealth,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

const app = express();

/** Starting the server with async import
 * - To avoid initializing the default logger when we `import from models` in `main.ts`
 * - Ticket #6209 should define a common bootstrap utility for all processes
 * - Once we fully decouple the models, we can remove the import from `main.ts` that's causing this issue
 */
const start = async () => {
  const { models } = await import('@hicommonwealth/model');
  config.NODE_ENV !== 'production' && console.log(config);

  const { main } = await import('./main');

  main(app, models, {
    port: config.PORT,
    noGlobalActivityCache: config.NO_GLOBAL_ACTIVITY_CACHE,
    withLoggingMiddleware: true,
    withStatsMiddleware: true,
    withFrontendBuild: !config.NO_CLIENT,
    withPrerender:
      config.NODE_ENV === 'production' &&
      !config.NO_PRERENDER &&
      config.SERVER_URL.includes('commonwealth.im'),
  })
    .then(() => {
      isServiceHealthy = true;
      // database clean-up jobs (should be run after the API so, we don't affect start-up time
      // TODO: evaluate other options for maintenance jobs
      if (typeof config.DB.CLEAN_HOUR !== 'undefined') {
        const databaseCleaner = new DatabaseCleaner();
        databaseCleaner.initLoop(models, config.DB.CLEAN_HOUR);
      }

      setInterval(() => {
        performContestRollovers().catch(console.error);
      }, 1_000 * 60);
    })
    .catch((e) => log.error(e.message, e));
};
void start();

export default app;
