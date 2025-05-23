import React, { useEffect, useState } from 'react';

import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import type { AnyProposal } from '../../../models/types';
import { VotingType } from '../../../models/types';

import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import app from 'state';
import VotingResultView from './VotingResultView';
import { getVoteOptions } from './utils';
import {
  SimpleYesApprovalVotingResult,
  YesNoAbstainVetoVotingResult,
} from './voting_result_components';

type VotingResultsProps = { proposal: AnyProposal };

export const VotingResults = (props: VotingResultsProps) => {
  const { proposal } = props;
  const [, setLoading] = useState(
    !app.chain || !app.chain.loaded || !app.chain.apiInitialized,
  );

  useEffect(() => {
    const listener = () => setLoading(false);
    app.chainAdapterReady.on('ready', listener);

    return () => {
      app.chainAdapterReady.off('ready', listener);
    };
  }, []);

  const votes = proposal.getVotes();
  if (
    proposal.votingType === VotingType.SimpleYesApprovalVoting &&
    (proposal instanceof CosmosProposal || proposal instanceof CosmosProposalV1)
  ) {
    return (
      <SimpleYesApprovalVotingResult
        approvedCount={proposal.depositorsAsVotes.length}
        // @ts-expect-error <StrictNullChecks/>
        proposal={proposal}
        votes={proposal.depositorsAsVotes}
      />
    );
  } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
    return (
      <SimpleYesApprovalVotingResult
        approvedCount={votes.length}
        proposal={proposal}
        votes={votes}
      />
    );
  } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
    // return different voting results on completed cosmos proposal, as voters are not available
    if ((proposal as CosmosProposal).data?.state?.tally) {
      const { yes, no, abstain, noWithVeto } = (proposal as CosmosProposal).data
        .state.tally;
      // TODO: move this marshalling into controller
      const voteOptions = getVoteOptions(yes, no, abstain, noWithVeto);

      return (
        <VotingResultView
          voteOptions={voteOptions}
          showCombineBarOnly={false}
        />
      );
    } else {
      return (
        <YesNoAbstainVetoVotingResult
          proposal={proposal as CosmosProposal}
          votes={votes}
        />
      );
    }
  } else {
    // to be implemented
    return null;
  }
};
