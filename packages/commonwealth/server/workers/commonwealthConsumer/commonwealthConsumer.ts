import {
  HotShotsStats,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { handleEvent, logger, stats } from '@hicommonwealth/core';
import { ContestWorker } from '@hicommonwealth/model';
import { EventNames } from '@hicommonwealth/schemas';
import { bootstrapBindings } from 'server/bindings/bootstrap';
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

function startRolloverLoop() {
  log.info('Starting rollover loop');

  const loop = async () => {
    try {
      await handleEvent(ContestWorker(), {
        name: EventNames.ContestRolloverTimerTicked,
        payload: {},
      });
    } catch (err) {
      log.error(err);
    }
  };

  // TODO: move to external service triggered via scheduler?
  setInterval(() => {
    loop().catch(console.error);
  }, 1_000 * 60);
}

async function main() {
  try {
    log.info('Starting main consumer');
    await bootstrapBindings();
    isServiceHealthy = true;
    startRolloverLoop();
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main();
}
