import { BigNumber } from '@ethersproject/bignumber';

export const calculateVoteWeight = (
  balance: string, // should be in wei
  voteWeight: number,
): BigNumber | null => {
  if (!balance || voteWeight <= 0) return null;
  const bigBalance = BigNumber.from(balance);
  const precision = 1e6;
  const scaledVoteWeight = Math.floor(voteWeight * precision);
  const result = bigBalance.mul(scaledVoteWeight).div(precision);
  return result;
};

export enum Denominations {
  'ETH' = 'ETH',
}
export const WeiDecimals: Record<Denominations, number> = {
  ETH: 18,
};
