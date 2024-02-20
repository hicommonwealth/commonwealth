export const calculateVoteWeight = (
  stakeBalance: string,
  voteWeight: number,
) => {
  // all community members get 1 weight by default
  return 1 + parseInt(stakeBalance, 10) * voteWeight;
};
