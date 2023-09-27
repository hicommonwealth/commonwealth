import React from 'react';
import AaveProposal, {
  AaveProposalVote,
} from '../../../../controllers/chain/ethereum/aave/proposal';
import { CWText } from '../../component_kit/cw_text';
import { VoteListing } from '../vote_listing';
import { AaveVotingResultCard } from '../votingResultCards/AaveVotingResultCard';

export type AaveVotingResultProps = {
  noBalanceString: string;
  noVotesCount: number;
  proposal: AaveProposal;
  votes: Array<AaveProposalVote>;
  yesBalanceString: string;
  yesVotesCount: number;
  isInCard?: boolean;
};

export const AaveVotingResult = (props: AaveVotingResultProps) => {
  const {
    noBalanceString,
    noVotesCount,
    proposal,
    votes,
    yesBalanceString,
    yesVotesCount,
    isInCard,
  } = props;

  if (isInCard) {
    return <AaveVotingResultCard {...props} />;
  }

  return (
    <div className="VotingResult">
      <div className="results-column-yes">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Yes (${yesBalanceString} ${yesVotesCount}) voters`}
        </CWText>
        <div className="results-subheader">
          <CWText type="h5" fontWeight="medium">
            User
          </CWText>
          <CWText type="h5" fontWeight="medium">
            Power
          </CWText>
        </div>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => !!v.choice)}
        />
      </div>
      <div className="results-column-no">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`No (${noBalanceString} ${noVotesCount}) voters`}
        </CWText>
        <div className="results-subheader">
          <CWText type="h5" fontWeight="medium">
            User
          </CWText>
          <CWText type="h5" fontWeight="medium">
            Power
          </CWText>
        </div>
        <VoteListing
          proposal={proposal}
          votes={votes.filter((v) => !v.choice)}
        />
      </div>
    </div>
  );
};
