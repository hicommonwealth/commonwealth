import { providers } from 'ethers';
import Web3 from 'web3';

import { addPrefix, factory } from './logging';

export async function createProvider(
  ethNetworkUrl: string,
  network?: string,
  chain?: string
): Promise<providers.Web3Provider> {
  const log = factory.getLogger(addPrefix(__filename, [network, chain]));
  try {
    const web3Provider = new Web3.providers.WebsocketProvider(ethNetworkUrl, {
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
    const data = await provider.getBlock('latest');
    if (!data)
      throw new Error(
        `A connection to ${ethNetworkUrl} could not be established.`
      );
    return provider;
  } catch (error) {
    log.error(`Failed to connect on ${ethNetworkUrl}: ${error.message}`);
    throw error;
  }
}
