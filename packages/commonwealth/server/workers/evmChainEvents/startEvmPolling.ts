import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import { fileURLToPath } from 'node:url';
import { EVM_CE_POLL_INTERVAL_MS } from '../../config';
import { processChainNode, scheduleNodeProcessing } from './nodeProcessing';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

/**
 * Starts an infinite loop that periodically fetches and parses blocks from
 * relevant EVM blockchains. Events parsed from these blocks are emitted
 * as chain-event notifications. The interval between each fetch is specified in milliseconds and should be
 * no more than 500k ms (500 seconds) so that we support any EVM chain that has an average block time of
 * 1 second or more (block fetching is limited to 500 blocks per interval). The recommended interval
 * is 120_000 ms (120 seconds) to avoid issues with public EVM nodes rate limiting requests.
 */
export async function startEvmPolling(
  interval: number,
): Promise<NodeJS.Timeout> {
  log.info(`Starting EVM poller`);
  if (interval > 500_000) {
    throw new Error(
      `Interval for EVM polling must be less than 500_000 ms (500 seconds)`,
    );
  }

  log.info(
    `All chains will be polled for events every ${interval / 1000} seconds`,
  );
  await scheduleNodeProcessing(models, interval, processChainNode);
  return setInterval(
    scheduleNodeProcessing,
    interval,
    models,
    interval,
    processChainNode,
  );
}

if (import.meta.url.endsWith(process.argv[1])) {
  startEvmPolling(EVM_CE_POLL_INTERVAL_MS).catch((e) => {
    log.fatal('Evm poller shutting down due to a critical error:', e);
    process.exit(1);
  });
}
