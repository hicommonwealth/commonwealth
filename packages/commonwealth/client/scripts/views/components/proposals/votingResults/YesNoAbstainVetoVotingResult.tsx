import clsx from 'clsx';
import React from 'react';
import {
  CosmosProposal,
  CosmosVote,
} from '../../../../controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { CWText } from '../../component_kit/cw_text';
import { VoteListing } from '../vote_listing';
import { YesNoAbstainVetoVotingResultCard } from '../votingResultCards/YesNoAbstainVetoVotingResultCard';

export type YesNoAbstainVetoVotingResultProps = {
  proposal: CosmosProposal;
  votes: Array<CosmosVote>;
  isInCard?: boolean;
};

export const YesNoAbstainVetoVotingResult = (
  props: YesNoAbstainVetoVotingResultProps
) => {
  const { proposal, votes, isInCard } = props;

  if (isInCard) {
    return <YesNoAbstainVetoVotingResultCard {...props} />;
  }

  return (
    <div className={clsx('VotingResult', { card: isInCard })}>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          Voted yes ({votes.filter((v) => v.choice === 'Yes').length})
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === 'Yes')}
        />
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          Voted no ({votes.filter((v) => v.choice === 'No').length})
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === 'No')}
        />
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          Voted abstain ({votes.filter((v) => v.choice === 'Abstain').length})
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === 'Abstain')}
        />
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          Voted veto ({votes.filter((v) => v.choice === 'NoWithVeto').length})
        </CWText>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => v.choice === 'NoWithVeto')}
        />
      </div>
    </div>
  );
};
