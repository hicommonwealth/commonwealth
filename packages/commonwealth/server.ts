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
  disableService,
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
  if (config.DISABLE_SERVICE) {
    // set-up health check endpoint to allow successful deployment on Railway
    app.get('/api/health', (_req, res) => {
      res.status(200).send('Service is disabled');
    });
    app.listen(config.PORT);
    await disableService();
  }

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

      // bootstrap bindings when DEV_MODULITH is true and not in prod
      // Enables: consumer, knock, message-relayer, graphile worker
      // Does not enable: twitter poller, Discord listener, evm CE
      if (config.DEV_MODULITH && config.APP_ENV !== 'production') {
        const {
          bootstrapBindings,
          bootstrapRelayer,
          bootstrapContestRolloverLoop,
        } = await import('./server/bindings/bootstrap');
        const { startGraphileWorker } = await import(
          './server/workers/graphileWorker/graphileWorker'
        );
        const { registerWorker } = await import(
          './server/bindings/workerLifecycle'
        );

        // Start workers asynchronously to avoid blocking the main event loop
        // Each worker registers its own cleanup with the workerLifecycle
        log.info('[modulith] Starting workers in background...');

        // bootstrapBindings must complete first to register RabbitMQ adapter
        // before other workers (like relayer) try to use broker()
        bootstrapBindings()
          .then(() => {
            // Start remaining workers in parallel after bindings are ready
            return Promise.all([
              bootstrapRelayer(),
              startGraphileWorker({
                onRunnerCreated: (runner) => {
                  registerWorker('graphile-worker', async () => {
                    log.info('Stopping Graphile Worker...');
                    await runner.stop();
                    log.info('Graphile Worker stopped');
                  });
                },
              }),
            ]);
          })
          .then(() => {
            // Contest rollover loop is sync, start after bindings are ready
            bootstrapContestRolloverLoop();
            log.info('[modulith] All workers started');
          })
          .catch((err) => {
            log.error('[modulith] Failed to start workers', err);
          });
      }
    })
    .catch((e) => {
      log.error(`Failed to initialize modulith mode: ${e.message}`, e);
    });
};
void start();

export default app;
