import {
  HotShotsStats,
  MixpanelAnalytics,
  PinoLogger,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { analytics, logger, stats } from '@hicommonwealth/core';
import express from 'express';

// bootstrap production adapters
const log = logger(PinoLogger()).getLogger(__filename);
stats(HotShotsStats());
analytics(MixpanelAnalytics());

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
  main(app, models)
    .then(() => {
      isServiceHealthy = true;
    })
    .catch((e) => log.error(e.message, e));
};
void start();

export default app;
