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

// handle exceptions thrown in express routes
import 'express-async-errors';

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
config.ANALYTICS.MIXPANEL_TOKEN &&
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
  // importing here to avoid conflicts with notifications provider port
  const { main } = await import('./main');

  config.APP_ENV === 'local' && console.log(config);

  await main(app, {
    port: config.PORT,
    withLoggingMiddleware: true,
    withPrerender:
      (config.APP_ENV === 'production' || config.APP_ENV === 'frick') &&
      !!config.PRERENDER_TOKEN,
  })
    .then(async () => {
      isServiceHealthy = true;
      // checking the DYNO env var ensures this only runs on one dyno
      if (
        config.APP_ENV === 'production' &&
        process.env.DYNO === 'web.1' &&
        config.ENABLE_CLIENT_PUBLISHING
      ) {
        const { dispatchSDKPublishWorkflow } = await import(
          './server/util/dispatchSDKPublishWorkflow'
        );
        dispatchSDKPublishWorkflow().catch((e) =>
          log.error(
            `Failed to dispatch publishing workflow ${JSON.stringify(e)}`,
          ),
        );
      }

      // bootstrap bindings when in dev mode and DEV_MODULITH is true
      if (config.NODE_ENV === 'development' && config.DEV_MODULITH) {
        const {
          bootstrapBindings,
          bootstrapRelayer,
          bootstrapContestRolloverLoop,
        } = await import('./server/bindings/bootstrap');
        await bootstrapBindings();
        await bootstrapRelayer();
        bootstrapContestRolloverLoop();
      }
    })
    .catch((e) => log.error(e.message, e));
};
void start();

export default app;
