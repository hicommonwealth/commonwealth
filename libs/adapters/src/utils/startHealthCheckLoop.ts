import { logger, stats } from '@hicommonwealth/core';

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
  const log = logger().getLogger(__filename);
  log.info(`starting health check loop for ${service}`);
  const key = `service.health.${service}`;
  // perform a loop that invokes 'checkFn' and sends status to stats
  const loop = async () => {
    const nextCheckAt = Date.now() + PING_INTERVAL;
    try {
      await checkFn();
      stats().on(key);
    } catch (err) {
      log.error(`${service}: ${err.message}`);
      stats().off(key);
    }
    const durationUntilNextCheck = nextCheckAt - Date.now();
    setTimeout(loop, durationUntilNextCheck);
  };
  loop();
}
