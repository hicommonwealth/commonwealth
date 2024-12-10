export const calculateVoteWeight = (
  balance: string, // should be in wei
  voteWeight: number = 0,
): bigint | null => {
  if (!balance || voteWeight <= 0) return null;
  return BigInt(balance) * BigInt(voteWeight);
};

export enum Denominations {
  'ETH' = 'ETH',
}
export const WeiDecimals: Record<Denominations, number> = {
  ETH: 18,
};
