import { ethers, providers } from 'ethers';

import { addPrefix, factory } from './logging';
import { JsonRpcProvider, Log, Provider } from '@ethersproject/providers';
import { Interface } from '@ethersproject/abi/src.ts/interface';
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

export async function getRawEvents(
  provider: JsonRpcProvider,
  eventSources: EvmEventSourceMapType,
  blockRange: { start: number | string; end: number | string },
  verbose = false
) {
  const logs: Log[] = await provider.send('eth_getLogs', [
    {
      fromBlock: ethers.BigNumber.from(blockRange.start).toHexString(),
      toBlock: ethers.BigNumber.from(blockRange.end).toHexString(),
      address: Object.keys(eventSources),
    },
  ]);

  const rawEvents = [];

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

    rawEvents.push(rawEvents);
  }

  return rawEvents;
}
