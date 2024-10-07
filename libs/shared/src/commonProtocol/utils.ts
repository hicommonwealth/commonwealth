export const calculateVoteWeight = (balance: string, voteWeight: number) => {
  return parseInt(balance, 10) * voteWeight;
};

export enum Denominations {
  'ETH' = 'ETH',
}
export const WeiDecimals: Record<Denominations, number> = {
  ETH: 18,
};
