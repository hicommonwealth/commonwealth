import { logger, stats } from '@hicommonwealth/core';

const PING_INTERVAL = 1_000 * 20;

export enum ServiceKey {
  Commonwealth = 'commonwealth',
  CommonwealthConsumer = 'commonwealth-consumer',
  MessageRelayer = 'message-relayer',
  DiscordBotListener = 'discord-bot-listener',
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

  const log = logger(import.meta);
  log.info(`starting health check loop for ${service}`);
  const key = `service.health.${service}`;
  // perform a loop that invokes 'checkFn' and sends status to stats
  const loop = async () => {
    const nextCheckAt = Date.now() + PING_INTERVAL;
    try {
      await checkFn();
      stats().on(key);
    } catch (err) {
      log.error(
        `${service}: ${err instanceof Error ? err.message : (err as string)}`,
      );
      stats().off(key);
    }
    const durationUntilNextCheck = nextCheckAt - Date.now();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(loop, durationUntilNextCheck);
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(loop, PING_INTERVAL);
}
