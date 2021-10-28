import { providers } from 'ethers';
import Web3 from 'web3';

import { addPrefix, factory } from './logging';

export async function createProvider(
  ethNetworkUrl: string,
  network?: string,
  chain?: string
): Promise<providers.Web3Provider> {
  const log = factory.getLogger(addPrefix(__filename, [network, chain]));

  if (
    !ethNetworkUrl.includes('alchemy') &&
    !ethNetworkUrl.includes('infura') &&
    !ethNetworkUrl.includes('localhost') &&
    !ethNetworkUrl.includes('127.0.0.1')
  )
    throw new Error('Must use Alchemy or Infura Ethereum API');
  if (process && process.env) {
    // only rewrite URL for alchemy/infura, preserve for localhost
    if (ethNetworkUrl.includes('alchemy') || ethNetworkUrl.includes('infura')) {
      // TODO: alchemy keys are different per network, so we need to ensure we have the correct
      //   keys for arbitrary networks
      let ALCHEMY_API_KEY;
      if (ethNetworkUrl.includes('ropsten')) {
        ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY_ROPSTEN;
        ethNetworkUrl = `wss://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;
      } else if (ethNetworkUrl.includes('mainnet')) {
        ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
        ethNetworkUrl = `wss://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;
      } else {
        throw new Error('Must be on either ropsten or mainnet');
      }
      if (!ALCHEMY_API_KEY) {
        throw new Error('Alchemy API key not found, check your .env file');
      }
    }

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
        throw new Error('A connection to Alchemy could not be established.');
      return provider;
    } catch (error) {
      log.error(`Failed to connect on ${ethNetworkUrl}`);
      log.error(`Check your ALCHEMY_API_KEY: ${error.message}`);
      throw error;
    }
  } else {
    throw new Error('must use nodejs to connect to Alchemy provider!');
  }
}
