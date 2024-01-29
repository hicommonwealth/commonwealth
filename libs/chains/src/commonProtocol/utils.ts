export const calculateVoteWeight = (
  stakeBalance: string,
  voteWeight: number,
) => {
  return parseInt(stakeBalance, 10) * voteWeight || 1;
};
