import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import axios from 'axios';
import { BASE_API_PATH } from 'utils/trpcClient';
import Web3 from 'web3';

export const distributeSkale = async (web3: Web3, chainId?: string) => {
  if (chainId && parseInt(chainId) === cp.ValidChains.SKALE_TEST) {
    const accounts = await web3.eth.getAccounts();
    const response = await axios.get(
      // eslint-disable-next-line max-len
      `${BASE_API_PATH}/token.distributeSkale?batch=1&input=%7B%220%22%3A%7B%22address%22%3A%22${accounts[0]}%22%2C%eth_chain_id%22%3A${chainId}%7D%7D`,
    );
    if (response.status !== 200) {
      throw new Error(
        `Request failed with status ${response.status}: ${response.statusText}`,
      );
    }
  }
};
