import {
  HotShotsStats,
  MixpanelAnalytics,
  PinoLogger,
  RedisCache,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { analytics, cache, logger, stats } from '@hicommonwealth/core';
import express from 'express';
import {
  DATABASE_CLEAN_HOUR,
  PORT,
  REDIS_URL,
  SERVER_URL,
  PRERENDER_TOKEN
} from './server/config';
import { DatabaseCleaner } from './server/util/databaseCleaner';

const PRODUCTION = process.env.NODE_ENV === 'production';
const SEND_EMAILS = process.env.SEND_EMAILS === 'true';
const NO_CLIENT = process.env.NO_CLIENT === 'true' || SEND_EMAILS;

// bootstrap production adapters
const log = logger(PinoLogger()).getLogger(__filename);
stats(HotShotsStats());
analytics(MixpanelAnalytics());
REDIS_URL && cache(new RedisCache(REDIS_URL));
PRODUCTION && !REDIS_URL && log.error('Missing REDIS_URL in production!');

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
  const { main } = await import('./main');
  main(app, models, {
    port: +PORT,
    noGlobalActivityCache: process.env.NO_GLOBAL_ACTIVITY_CACHE === 'true',
    withLoggingMiddleware: true,
    withStatsMiddleware: true,
    withFrontendBuild: !NO_CLIENT,
    withPrerender: !!PRERENDER_TOKEN
  })
    .then(() => {
      isServiceHealthy = true;
      // database clean-up jobs (should be run after the API so, we don't affect start-up time
      // TODO: evaluate other options for maintenance jobs
      if (typeof DATABASE_CLEAN_HOUR !== 'undefined') {
        const databaseCleaner = new DatabaseCleaner();
        databaseCleaner.initLoop(models, Number(DATABASE_CLEAN_HOUR));
      }
    })
    .catch((e) => log.error(e.message, e));
};
void start();

export default app;
