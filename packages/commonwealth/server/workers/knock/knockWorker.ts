import {
  HotShotsStats,
  KnockProvider,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  dispose,
  logger,
  notificationsProvider,
  stats,
} from '@hicommonwealth/core';
import { bootstrapBindings } from 'server/bindings/bootstrap';
import { fileURLToPath } from 'url';
import { config } from '../../config';

const log = logger(import.meta);

stats({ adapter: HotShotsStats() });

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: fileURLToPath(import.meta.url).endsWith(process.argv[1]),
  service: ServiceKey.CommonwealthConsumer,
  // eslint-disable-next-line @typescript-eslint/require-await
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

async function startKnockWorker() {
  log.info('Starting Knock Worker');

  // init Knock as notifications provider - this is necessary since the policies do not define the provider
  if (config.NOTIFICATIONS.FLAG_KNOCK_INTEGRATION_ENABLED)
    notificationsProvider({
      adapter: KnockProvider(),
    });
  else notificationsProvider();

  await bootstrapBindings(false, true);

  isServiceHealthy = true;
  log.info('Knock Worker started');
}

if (import.meta.url.endsWith(process.argv[1])) {
  startKnockWorker().catch((err) => {
    log.fatal('A fatal error occurred with the Knock Worker', err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
}
