export const calculateVoteWeight = (
  stakeBalance: string,
  voteWeight: number,
) => {
  return parseInt(stakeBalance, 10) * voteWeight;
};

export enum Denominations {
  'ETH' = 'ETH',
}
export const WeiDecimals: Record<Denominations, number> = {
  ETH: 18,
};
