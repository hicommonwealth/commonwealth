import { BigNumber } from '@ethersproject/bignumber';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { veBridgeAbi } from '../../abis/veBridgeAbi';

// TODO: @egetekiner or @ianrowan to provide helper function to invoke functions on this contract
// to be used for unit testing
export const lockTokens = async (
  rpcNodeUrl: string,
  address: string,
  amount: BigNumber,
  duration: BigNumber,
  isPermanent: boolean,
): Promise<any> => {
  const web3 = new Web3(rpcNodeUrl);
  const contract = new web3.eth.Contract(veBridgeAbi as AbiItem[], address);

  return await contract.methods.lockTokens(amount, duration, isPermanent).send({
    from: address,
  });
};
