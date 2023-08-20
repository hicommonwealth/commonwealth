import { VotingResult } from '../voting_result_components';

export function DefaultVotingResult({ votes, proposal }) {
  return (
    <VotingResult
      yesVotes={votes.filter((v) => v.choice === true)}
      noVotes={votes.filter((v) => v.choice === false)}
      proposal={proposal}
    />
  );
}
