import { BigNumber } from '@ethersproject/bignumber';

export const calculateVoteWeight = (
  balance: string,
  voteWeight: number,
): BigNumber => {
  // since BigNumber doesn't support float,
  // must multiply by scale factor and divide
  const balanceBN = BigNumber.from(balance);
  const scaleFactor = BigNumber.from(10 ** 18);
  const voteWeightBN = BigNumber.from(Math.floor(voteWeight * 10 ** 18));
  const result = balanceBN.mul(voteWeightBN).div(scaleFactor);
  return result;
};

export enum Denominations {
  'ETH' = 'ETH',
}
export const WeiDecimals: Record<Denominations, number> = {
  ETH: 18,
};
