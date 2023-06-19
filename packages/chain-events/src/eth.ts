import { ethers, providers } from 'ethers';

import { addPrefix, factory } from './logging';

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

export async function getParser(
  contractAddress: string,
  abi: any,
  retryTimeMs
) {
  switch (contractAddress) {
    case '':
      return new ethers.utils.Interface(abi);
  }
}
