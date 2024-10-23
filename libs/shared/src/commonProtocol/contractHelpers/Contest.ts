import { BigNumber } from '@ethersproject/bignumber';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';

export const getTotalContestBalance = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contestContract: any,
  contestAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  web3: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feeManagerAbi: any[],
  oneOff?: boolean,
): Promise<string> => {
  const promises = [contestContract.methods.contestToken().call()];

  if (!oneOff) {
    promises.push(contestContract.methods.FeeMangerAddress().call());
  }

  const results = await Promise.all(promises);

  const balancePromises: Promise<string>[] = [];

  if (!oneOff) {
    const feeManager = new web3.eth.Contract(feeManagerAbi, String(results[1]));
    balancePromises.push(
      feeManager.methods
        .getBeneficiaryBalance(contestAddress, results[0])
        .call(),
    );
  }
  if (String(results[0]) === ZERO_ADDRESS) {
    balancePromises.push(
      web3.eth.getBalance(contestAddress).then((v: any) => {
        return v.toString();
      }),
    );
  } else {
    const calldata =
      '0x70a08231' +
      web3.eth.abi.encodeParameters(['address'], [contestAddress]).substring(2);
    balancePromises.push(
      web3.eth
        .call({
          to: String(results[0]),
          data: calldata,
        })
        .then((v: string) => {
          return web3.eth.abi.decodeParameter('uint256', v);
        }),
    );
  }

  const balanceResults = await Promise.all(balancePromises);

  const balance =
    balanceResults.length === 2
      ? BigNumber.from(balanceResults[0]).add(balanceResults[1])
      : BigNumber.from(balanceResults[0]);

  return BigNumber.from(balance).toString();
};
