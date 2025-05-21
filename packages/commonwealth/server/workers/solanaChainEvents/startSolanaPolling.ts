import { dispose, logger } from '@hicommonwealth/core';
import { config } from '../../config';
import {
  processChainNode,
  scheduleSolanaNodeProcessing,
} from './nodeProcessing';

const log = logger(import.meta);

/**
 * Starts an infinite loop that periodically fetches and parses events from
 * relevant Solana programs. Events parsed from these transactions are emitted
 * as chain-event notifications. The interval between each fetch is specified in milliseconds.
 */
export async function startSolanaPolling(
  interval: number,
): Promise<NodeJS.Timeout> {
  log.info(`Starting Solana poller`);
  if (interval > 300_000) {
    throw new Error(
      `Interval for Solana polling must be less than 300_000 ms (5 minutes)`,
    );
  }

  log.info(
    `All Solana chains will be polled for events every ${interval / 1000} seconds`,
  );
  await scheduleSolanaNodeProcessing(interval, processChainNode);
  return setInterval(
    scheduleSolanaNodeProcessing,
    interval,
    interval,
    processChainNode,
  );
}

if (import.meta.url.endsWith(process.argv[1])) {
  startSolanaPolling(config.SOLANA_CE.POLL_INTERVAL_MS).catch((e) => {
    log.fatal('Solana poller shutting down due to a critical error:', e);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
}
