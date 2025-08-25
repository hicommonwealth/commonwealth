import { disableService, dispose, logger } from '@hicommonwealth/core';
import { factoryContracts } from '@hicommonwealth/evm-protocols';
import { getAddress } from 'viem';
import { config } from '../../config';
import { processChainNode, scheduleNodeProcessing } from './nodeProcessing';

const log = logger(import.meta);

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
  await disableService();
  log.info(`Starting EVM poller`);
  if (interval > 500_000) {
    throw new Error(
      `Interval for EVM polling must be less than 500_000 ms (500 seconds)`,
    );
  }

  log.info(
    `All chains will be polled for events every ${interval / 1000} seconds`,
  );

  // Validate factory contract addresses are checksum
  for (const [chainId, contracts] of Object.entries(factoryContracts)) {
    for (const [contractName, address] of Object.entries(contracts)) {
      if (typeof address === 'string') {
        try {
          if (getAddress(address) !== address) {
            log.fatal(
              `Invalid checksum address for ${contractName} on chain ${chainId}: ${address}`,
            );
          }
        } catch (e) {
          log.fatal(
            `Invalid checksum address for ${contractName} on chain ${chainId}: ${address}`,
          );
        }
      }
    }
  }

  await scheduleNodeProcessing(interval, processChainNode);
  return setInterval(
    scheduleNodeProcessing,
    interval,
    interval,
    processChainNode,
  );
}

if (import.meta.url.endsWith(process.argv[1])) {
  startEvmPolling(config.EVM_CE.POLL_INTERVAL_MS).catch((e) => {
    log.fatal('Evm poller shutting down due to a critical error:', e);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
}
