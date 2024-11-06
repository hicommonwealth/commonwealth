import {
  HotShotsStats,
  KnockProvider,
  MixpanelAnalytics,
  R2BlobStorage,
  RedisCache,
  S3BlobStorage,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  analytics,
  blobStorage,
  cache,
  logger,
  notificationsProvider,
  stats,
} from '@hicommonwealth/core';
import { R2_ADAPTER_KEY } from '@hicommonwealth/model';
import express from 'express';
import { config } from './server/config';
import { DatabaseCleaner } from './server/util/databaseCleaner';

// handle exceptions thrown in express routes
import 'express-async-errors';
import { dispatchSDKPublishWorkflow } from './server/util/dispatchSDKPublishWorkflow';

// bootstrap adapters
stats({
  adapter: HotShotsStats(),
});
blobStorage({
  adapter: S3BlobStorage(),
});
blobStorage({
  key: R2_ADAPTER_KEY,
  adapter: R2BlobStorage(),
  isDefault: false,
});
(config.ANALYTICS.MIXPANEL_DEV_TOKEN || config.ANALYTICS.MIXPANEL_PROD_TOKEN) &&
  analytics({
    adapter: MixpanelAnalytics(),
  });
config.NOTIFICATIONS.FLAG_KNOCK_INTEGRATION_ENABLED &&
  notificationsProvider({
    adapter: KnockProvider(),
  });
config.CACHE.REDIS_URL &&
  cache({
    adapter: new RedisCache(config.CACHE.REDIS_URL),
  });

const log = logger(import.meta);

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
  config.APP_ENV === 'local' && console.log(config);

  const { main } = await import('./main');

  main(app, models, {
    port: config.PORT,
    withLoggingMiddleware: true,
    withPrerender: config.APP_ENV === 'production' && !config.NO_PRERENDER,
  })
    .then(() => {
      isServiceHealthy = true;
      // database clean-up jobs (should be run after the API so, we don't affect start-up time
      // TODO: evaluate other options for maintenance jobs
      if (typeof config.DB.CLEAN_HOUR !== 'undefined') {
        const databaseCleaner = new DatabaseCleaner();
        databaseCleaner.initLoop(models, config.DB.CLEAN_HOUR);
      }

      // checking the DYNO env var ensures this only runs on one dyno
      if (config.APP_ENV === 'production' && process.env.DYNO === 'web.1') {
        dispatchSDKPublishWorkflow();
      }
    })
    .catch((e) => log.error(e.message, e));
};
void start();

export default app;
