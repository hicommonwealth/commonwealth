import { ethers, providers } from 'ethers';

import { addPrefix, factory } from './logging';
import { JsonRpcProvider, Log } from '@ethersproject/providers';
import { EvmEventSourceMapType } from 'chain-events/src/interfaces';

export async function createProvider(
  ethNetworkUrl: string,
  network?: string,
  chain?: string
): Promise<providers.Web3Provider> {
  const log = factory.getLogger(addPrefix(__filename, [network, chain]));
  try {
    const Web3 = (await import('web3')).default;
    const web3Provider =
      ethNetworkUrl.slice(0, 4) == 'http'
        ? new Web3.providers.HttpProvider(ethNetworkUrl)
        : new Web3.providers.WebsocketProvider(ethNetworkUrl, {
            clientConfig: {
              maxReceivedFrameSize: 2000000, // bytes - default: 1MiB, current: 2MiB
              maxReceivedMessageSize: 10000000, // bytes - default: 8MiB, current: 10Mib
            },
            reconnect: {
              auto: true,
              delay: 5000,
              maxAttempts: 10,
              onTimeout: true,
            },
          });

    const provider = new providers.Web3Provider(web3Provider);
    // 12s minute polling interval (default is 4s)
    provider.pollingInterval = 12000;
    const blockNumber = await provider.getBlockNumber();
    if (!blockNumber)
      throw new Error(
        `A connection to ${ethNetworkUrl} could not be established.`
      );
    return provider;
  } catch (error) {
    log.error(`Failed to connect on ${ethNetworkUrl}: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches logs from the specified block range. Most nodes cap eth_getLogs calls at 10k logs or 2k blocks with 150MB
 * limit. Given these restrictions, if the block range is larger than 500 (historically this has worked well for us)
 * this function will make multiple calls to fetch and process 500 blocks at a time.
 * @param provider A JsonRpcProvider with a valid connection to an RPC node used to fetch logs
 * @param eventSources An object in which the keys are contract addresses and the values are objects containing
 * the event signatures we are interested in and the interface used to parse relevant events
 * @param blockRange The range of blocks to fetch logs from. If end is not defined the function will fetch until the
 * latest block
 * @param verbose A boolean indicating whether each raw event should be logged.
 */
export async function getRawEvents(
  provider: JsonRpcProvider,
  eventSources: EvmEventSourceMapType,
  blockRange: { start: number; end?: number },
  verbose = false
) {
  const MAX_BLOCK_RANGE = 500;
  let { start, end } = blockRange;
  const rawEvents = [];
  if (!end) end = await provider.getBlockNumber();

  while (start <= end) {
    // if end is not given then go until the latest block number
    if (!end) end = await provider.getBlockNumber();
    const toBlock = Math.min(start + MAX_BLOCK_RANGE, end);

    const logs: Log[] = await provider.send('eth_getLogs', [
      {
        fromBlock: ethers.BigNumber.from(start).toHexString(),
        toBlock: ethers.BigNumber.from(toBlock).toHexString(),
        address: Object.keys(eventSources),
      },
    ]);

    for (const log of logs) {
      // skip logs for events that we don't care about
      if (
        !eventSources[log.address.toLowerCase()].eventSignatures.includes(
          log.topics[0]
        )
      )
        continue;

      // parse the log
      const parsedRawEvent =
        eventSources[log.address.toLowerCase()].api.parseLog(log);

      const rawEvent = {
        address: log.address.toLowerCase(),
        args: parsedRawEvent.args as any,
        name: parsedRawEvent.name,
        blockNumber: parseInt(log.blockNumber.toString(), 16),
        data: log.data,
      };

      if (verbose) {
        const logStr = `Found the following event log in block ${
          log.blockNumber
        }: ${JSON.stringify(rawEvent, null, 2)}.`;

        const logger = factory.getLogger(
          addPrefix(__filename, [log.address.toLowerCase()])
        );
        logger.info(logStr);
      }

      rawEvents.push(rawEvent);
    }

    start = toBlock + 1;
  }

  return rawEvents;
}

/**
 * This function replaces all instances of type_parser for EVM chains since the original
 * type_parser functions simply converted from Pascal case to Kebab case e.g.
 * ProposalCreated -> proposal-created. This function is used to format the event names (kinds).
 * @param str
 */
export function pascalToKebabCase(str) {
  if (!str) return null;

  return str
    .replace(/\.?([A-Z]+)/g, (x, y) => '-' + y.toLowerCase())
    .replace(/^-/, '');
}
