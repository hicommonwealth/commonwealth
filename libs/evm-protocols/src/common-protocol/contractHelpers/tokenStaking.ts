import { AbiItem, Contract } from 'web3';

export const lockTokens = async (
  contract: Contract<AbiItem[]>,
  address: string,
  amount: string,
  duration: string,
  isPermanent: boolean,
): Promise<any> => {
  return await contract.methods.lockTokens(amount, duration, isPermanent).send({
    from: address,
  });
};
