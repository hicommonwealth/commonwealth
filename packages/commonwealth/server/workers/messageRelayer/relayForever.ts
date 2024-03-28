import { PinoLogger } from '@hicommonwealth/adapters';
import { broker, logger, stats } from '@hicommonwealth/core';
import { MESSAGE_RELAYER_TIMEOUT_MS } from '../../config';
import { relay } from './relay';

const log = logger(PinoLogger()).getLogger(__filename);
export let numUnrelayedEvents = 0;

export function incrementNumUnrelayedEvents(numEvents: number) {
  numUnrelayedEvents += numEvents;
  stats().gauge('messageRelayerNumUnrelayedEvents', numUnrelayedEvents);
}

export async function relayForever(maxIterations?: number) {
  const { models } = await import('@hicommonwealth/model');
  const brokerInstance = broker();
  let iteration = 0;
  while (true) {
    if (maxIterations && iteration >= maxIterations) {
      break;
    }

    if (numUnrelayedEvents > 0) {
      const numRelayedEvents = await relay(brokerInstance, models);
      numUnrelayedEvents -= numRelayedEvents;
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
