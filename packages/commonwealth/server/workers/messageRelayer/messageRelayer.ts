import { ServiceKey, startHealthCheckLoop } from '@hicommonwealth/adapters';
import { logger } from '@hicommonwealth/core';
import { bootstrapBindings, bootstrapRelayer } from 'server/bindings/bootstrap';

const log = logger(import.meta);

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: import.meta.url.endsWith(process.argv[1]),
  service: ServiceKey.MessageRelayer,
  // eslint-disable-next-line @typescript-eslint/require-await
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

export async function startMessageRelayer(maxRelayIterations?: number) {
  await bootstrapBindings({ worker: 'none' });
  const pgClient = await bootstrapRelayer(maxRelayIterations);
  isServiceHealthy = true;
  return pgClient;
}

if (import.meta.url.endsWith(process.argv[1])) {
  startMessageRelayer().catch((err) => {
    log.fatal(
      'Unknown error fatal requires immediate attention. Restart REQUIRED!',
      err,
    );
    // if we process.exit(1) here we start an infinite loop of retrying to publish events
  });
}
