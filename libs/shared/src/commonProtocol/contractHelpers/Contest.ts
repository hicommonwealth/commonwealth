import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { feeManagerABI } from './abis/feeManagerAbi';

export const getContestBalanceShared = async (
  contract: any,
  contest: string,
  web3: any,
  oneOff?: boolean,
): Promise<number> => {
  const promises = [contract.methods.contestToken().call()];

  if (!oneOff) {
    promises.push(contract.methods.FeeMangerAddress().call());
  }

  const results = await Promise.all(promises);

  const balancePromises: Promise<number>[] = [];

  if (!oneOff) {
    const feeManager = new web3.eth.Contract(feeManagerABI, String(results[1]));

    balancePromises.push(
      feeManager.methods.getBeneficiaryBalance(contest, results[0]).call(),
    );
  }
  if (String(results[0]) === ZERO_ADDRESS) {
    balancePromises.push(
      web3.eth.getBalance(contest).then((v) => {
        return Number(v);
      }),
    );
  } else {
    const calldata =
      '0x70a08231' +
      web3.eth.abi.encodeParameters(['address'], [contest]).substring(2);
    balancePromises.push(
      web3.eth
        .call({
          to: String(results[0]),
          data: calldata,
        })
        .then((v) => {
          return Number(web3.eth.abi.decodeParameter('uint256', v));
        }),
    );
  }

  const balanceResults = await Promise.all(balancePromises);

  return Number(
    balanceResults.length === 2
      ? BigInt(balanceResults[0]) + BigInt(balanceResults[1])
      : BigInt(balanceResults[0]),
  );
};
