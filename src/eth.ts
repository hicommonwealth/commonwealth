import { providers } from 'ethers';
import Web3 from 'web3';

export function createProvider(ethNetworkUrl: string): providers.Web3Provider {
  if (ethNetworkUrl.includes('infura')) {
    const networkPrefix = ethNetworkUrl.split('infura')[0];
    if (process && process.env) {
      const { INFURA_API_KEY } = process.env;
      if (!INFURA_API_KEY) {
        throw new Error('no infura key found!');
      }
      ethNetworkUrl = `${networkPrefix}infura.io/ws/v3/${INFURA_API_KEY}`;
    } else {
      throw new Error('must use nodejs to connect to infura provider!');
    }
  }
  const web3Provider = new Web3.providers.WebsocketProvider(ethNetworkUrl, {
    reconnect: {
      auto: true,
      delay: 5000,
      onTimeout: true,
    },
  });
  const provider = new providers.Web3Provider(web3Provider);
  // 12s minute polling interval (default is 4s)
  provider.pollingInterval = 12000;
  return provider;
}
