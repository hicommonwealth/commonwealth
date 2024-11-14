import { ServerError } from '@hicommonwealth/core';
import Web3 from 'web3';
import { config } from '../../config';

/**
 * A helper for creating the web3 provider via an RPC, including private key import
 * @param rpc the rpc of the network to use helper with
 * @returns
 */
export const createWeb3Provider = async (rpc: string): Promise<Web3> => {
  if (!config.WEB3.PRIVATE_KEY)
    throw new ServerError('WEB3 private key not set!');
  const web3 = new Web3(rpc);
  const account = web3.eth.accounts.privateKeyToAccount(
    config.WEB3.PRIVATE_KEY,
  );
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;
  return web3;
};
