import {
  HotShotsStats,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { logger, stats } from '@hicommonwealth/core';
import {
  bootstrapBindings,
  bootstrapCommunityIndexerLoop,
  bootstrapContestRolloverLoop,
} from 'server/bindings/bootstrap';
import { fileURLToPath } from 'url';

const log = logger(import.meta);

stats({ adapter: HotShotsStats() });

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: fileURLToPath(import.meta.url).endsWith(process.argv[1]),
  service: ServiceKey.CommonwealthConsumer,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

// CommonwealthConsumer is a server that consumes (and processes) RabbitMQ messages
// from external apps or services (like the Snapshot Service). It exists because we
// don't want to modify the Commonwealth database directly from external apps/services.
// You would use the script if you are starting an external service that transmits messages
// to the CommonwealthConsumer and you want to ensure that the CommonwealthConsumer is
// properly handling/processing those messages. Using the script is rarely necessary in
// local development.
async function main() {
  try {
    log.info('Starting main consumer');
    await bootstrapBindings();
    isServiceHealthy = true;
    bootstrapContestRolloverLoop();
    bootstrapCommunityIndexerLoop();
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main();
}
