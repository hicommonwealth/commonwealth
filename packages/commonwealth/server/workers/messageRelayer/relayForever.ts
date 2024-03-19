import { PinoLogger } from '@hicommonwealth/adapters';
import { broker, logger } from '@hicommonwealth/core';
import { relay } from './relay';

const log = logger(PinoLogger()).getLogger(__filename);
let numUnrelayedEvents = 0;

export function incrementNumUnrelayedEvents(numEvents: number) {
  numUnrelayedEvents += numEvents;
}

export async function relayForever(maxIterations?: number) {
  let iteration = 0;
  while (true) {
    if (maxIterations && iteration >= maxIterations) {
      break;
    }

    if (numUnrelayedEvents > 0) {
      const numRelayedEvents = await relay(broker());
      numUnrelayedEvents -= numRelayedEvents;
    }

    if (numUnrelayedEvents === 0) {
      // wait 200ms before checking again so we don't clog execution
      await new Promise((resolve) => setTimeout(resolve, 200));
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
