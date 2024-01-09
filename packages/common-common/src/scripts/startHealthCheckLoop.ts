import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import { StatsDController } from '../../src/statsd';

const log = loggerFactory.getLogger(formatFilename(__filename));

const PING_INTERVAL = 1_000 * 20;

export enum ServiceKey {
  Commonwealth = 'commonwealth',
  CommonwealthConsumer = 'commonwealth-consumer',
  DiscordBotListener = 'discord-bot-listener',
  DiscordBotConsumer = 'discord-bot-consumer',
  ChainEventsApp = 'chain-events-app',
  ChainEventsConsumer = 'chain-events-consumer',
  ChainEventsSubscriber = 'chain-events-subscriber',
  SnapshotListener = 'snapshot-listener',
}

export type HealthCheckOptions = {
  enabled?: boolean;
  service: ServiceKey;
  // the health check function should throw if the service is unhealthy
  checkFn: () => Promise<void>;
};

export function startHealthCheckLoop({
  enabled = true,
  service,
  checkFn,
}: HealthCheckOptions) {
  if (!enabled) {
    return;
  }
  log.info(`starting health check loop for ${service}`);
  const stat = `service.health.${service}`;
  // perform a loop that invokes 'checkFn' and sends status to StatsD
  const loop = async () => {
    const nextCheckAt = Date.now() + PING_INTERVAL;
    let status = 0;
    try {
      await checkFn();
      status = 1;
    } catch (err) {
      log.error(err.message);
    }
    StatsDController.get().gauge(stat, status);
    const durationUntilNextCheck = nextCheckAt - Date.now();
    setTimeout(loop, durationUntilNextCheck);
  };
  loop();
}
