export const buildVoteDirectionString = (voteOption: string) => {
  if (!voteOption) {
    return '';
  }

  return `You voted "${voteOption}"`;
};
