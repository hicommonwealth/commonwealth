import { broker, logger, stats } from '@hicommonwealth/core';
import { config } from '../config';
import { relay } from './relay';

const INITIAL_ERROR_TIMEOUT = 2_000;

const log = logger(import.meta);
export let numUnrelayedEvents = 0;

export function incrementNumUnrelayedEvents(numEvents: number) {
  numUnrelayedEvents += numEvents;
  stats().gauge('messageRelayerNumUnrelayedEvents', numUnrelayedEvents);
}

export function resetNumUnrelayedEvents() {
  numUnrelayedEvents = 0;
}

export async function relayForever(maxIterations?: number) {
  const { models } = await import('@hicommonwealth/model');
  const brokerInstance = broker();
  let iteration = 0;
  let errorTimeout = INITIAL_ERROR_TIMEOUT;
  while (true) {
    if (typeof maxIterations === 'number' && iteration >= maxIterations) {
      break;
    }

    if (numUnrelayedEvents > 0) {
      const numRelayedEvents = await relay(brokerInstance, models);

      if (numRelayedEvents === 0) {
        // failed to publish any messages - requires manual intervention
        // pause execution and retry/report error again in
        await new Promise((resolve) => setTimeout(resolve, errorTimeout));
        errorTimeout *= 3;
      } else {
        numUnrelayedEvents -= numRelayedEvents;
        errorTimeout = INITIAL_ERROR_TIMEOUT;
      }

      stats().gauge('messageRelayerNumUnrelayedEvents', numUnrelayedEvents);
    }

    if (numUnrelayedEvents === 0) {
      // wait 200ms before checking again so we don't clog execution
      await new Promise((resolve) =>
        setTimeout(resolve, config.WORKERS.MESSAGE_RELAYER_TIMEOUT_MS),
      );
    } else if (numUnrelayedEvents > 1000) {
      log.error('More than 1000 unrelayed events in the Outbox!', undefined, {
        numUnrelayedEvents,
      });
    }

    if (maxIterations) {
      iteration += 1;
    }
  }
}
