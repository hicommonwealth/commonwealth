import { broker, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { QueryTypes } from 'sequelize';
import { config } from '../config';
import { relay } from './relay';
import { isShutdownInProgress } from './workerLifecycle';

const INITIAL_ERROR_TIMEOUT = 2_000;
const OUTBOX_CHECK_INITIAL_DELAY = 1_000;
const OUTBOX_CHECK_MAX_DELAY = 30_000;

const log = logger(import.meta);

/**
 * Waits for the Outbox table to be accessible before proceeding.
 * Retries with exponential backoff, respecting shutdown signals.
 */
export async function waitForOutboxTable(): Promise<void> {
  let delay = OUTBOX_CHECK_INITIAL_DELAY;

  log.info('Checking Outbox table accessibility...');

  while (!isShutdownInProgress()) {
    try {
      await models.sequelize.query('SELECT 1 FROM "Outbox" LIMIT 0', {
        type: QueryTypes.SELECT,
      });
      log.info('Outbox table is accessible');
      return;
    } catch {
      log.warn(`Outbox table not yet accessible, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, OUTBOX_CHECK_MAX_DELAY);
    }
  }

  log.info('Shutdown in progress, aborting Outbox readiness check');
}

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
