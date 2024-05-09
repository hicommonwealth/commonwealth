import { broker, stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { fileURLToPath } from 'url';
import { MESSAGE_RELAYER_TIMEOUT_MS } from '../../config';
import { relay } from './relay';

const INITIAL_ERROR_TIMEOUT = 2_000;

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
export let numUnrelayedEvents = 0;

export function incrementNumUnrelayedEvents(numEvents: number) {
  numUnrelayedEvents += numEvents;
  stats().gauge('messageRelayerNumUnrelayedEvents', numUnrelayedEvents);
}

export async function relayForever(maxIterations?: number) {
  const { models } = await import('@hicommonwealth/model');
  const brokerInstance = broker();
  let iteration = 0;
  let errorTimeout = INITIAL_ERROR_TIMEOUT;
  while (true) {
    if (maxIterations && iteration >= maxIterations) {
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
        setTimeout(resolve, MESSAGE_RELAYER_TIMEOUT_MS),
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
