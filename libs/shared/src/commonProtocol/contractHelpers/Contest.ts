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
): Promise<number> => {
  const promises = [contestContract.methods.contestToken().call()];

  if (!oneOff) {
    promises.push(contestContract.methods.FeeMangerAddress().call());
  }

  const results = await Promise.all(promises);

  const balancePromises: Promise<number>[] = [];

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
      web3.eth.getBalance(contestAddress).then((v: bigint) => {
        return Number(v);
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
