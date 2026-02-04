import { broker, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { config } from '../config';
import { relay } from './relay';
import { isShutdownInProgress } from './workerLifecycle';

const INITIAL_ERROR_TIMEOUT = 2_000;

const log = logger(import.meta);

export async function relayForever(maxIterations?: number) {
  const brokerInstance = broker();
  let iteration = 0;
  let errorTimeout = INITIAL_ERROR_TIMEOUT;
  while (!isShutdownInProgress()) {
    if (typeof maxIterations === 'number' && iteration >= maxIterations) {
      break;
    }

    try {
      const { numFetched, numPublished } = await relay(brokerInstance, models);

      // error cases
      if (numFetched > 0 && numPublished === 0) {
        // failed to publish any messages
        log.fatal(
          'Failed to publish any messages. Retrying in ${errorTimeout}ms!',
        );
        await new Promise((resolve) => setTimeout(resolve, errorTimeout));
        errorTimeout *= 3;
        iteration += 1;
        continue;
      } else if (numFetched !== numPublished) {
        // failed to publish some messages
        log.error('Failed to publish some messages');
      }

      // reset error timeout delay
      errorTimeout = INITIAL_ERROR_TIMEOUT;
      if (numFetched < config.WORKERS.MESSAGE_RELAYER_PREFETCH) {
        // if there are no existing queued messages,
        // wait for 1 second before querying for new events
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    } catch (e) {
      log.error('Error while relaying', e);
    }

    if (maxIterations) {
      iteration += 1;
    }
  }

  log.info('Message relayer stopped');
}
