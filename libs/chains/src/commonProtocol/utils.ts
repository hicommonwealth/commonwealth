export const calculateVoteWeight = (
  stakeBalance: string,
  stakeScaler: number,
) => {
  return parseInt(stakeBalance, 10) * stakeScaler || 1;
};
