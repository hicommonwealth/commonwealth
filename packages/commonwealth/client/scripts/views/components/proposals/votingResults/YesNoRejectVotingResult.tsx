import React from 'react';
import NearSputnikProposal from '../../../../controllers/chain/near/sputnik/proposal';
import {
  NearSputnikVote,
  NearSputnikVoteString,
} from '../../../../controllers/chain/near/sputnik/types';
import { CWText } from '../../component_kit/cw_text';
import { VoteListing } from '../vote_listing';
import { YesNoRejectVotingResultCard } from '../votingResultCards/YesNoRejectVotingResultCard';

export type YesNoRejectVotingResultProps = {
  proposal: NearSputnikProposal;
  votes: Array<NearSputnikVote>;
  isInCard?: boolean;
};

export const YesNoRejectVotingResult = (
  props: YesNoRejectVotingResultProps
) => {
  const { proposal, votes, isInCard } = props;

  if (isInCard) {
    return <YesNoRejectVotingResultCard {...props} />;
  }

  return (
    <div className="VotingResult">
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          Voted approve (
          {
            votes.filter((v) => v.choice === NearSputnikVoteString.Approve)
              .length
          }
          )
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter(
            (v) => v.choice === NearSputnikVoteString.Approve
          )}
        />
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          Voted reject (
          {
            votes.filter((v) => v.choice === NearSputnikVoteString.Reject)
              .length
          }
          )
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === NearSputnikVoteString.Reject)}
        />
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          Voted remove (
          {
            votes.filter((v) => v.choice === NearSputnikVoteString.Remove)
              .length
          }
          )
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === NearSputnikVoteString.Remove)}
        />
      </div>
    </div>
  );
};
