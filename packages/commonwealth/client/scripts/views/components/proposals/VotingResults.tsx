import React, { useEffect } from 'react';

import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import type { AnyProposal } from '../../../models/types';
import { VotingType } from '../../../models/types';

import app from 'state';
import { AaveProposalResult } from './AaveProposalResult';
import { SimpleYesApprovalResult } from './SimpleYesApprovalResult';
import useForceRerender from 'hooks/useForceRerender';
import { CompoundYesNoAbstainResult } from './votingResults/CompoundYesNoAbstainResult';
import { CompoundYesNoResult } from './votingResults/CompoundYesNoResult';
import { DefaultVotingResult } from './votingResults/DefaultVotingResult';
import { YesNoAbstainVetoResult } from './YesNoAbstainVetoResult';
import { YesNoRejectResult } from './YesNoRejectResult';

type VotingResultsProps = { proposal: AnyProposal };

export const VotingResults = (
  props: VotingResultsProps,
  inCardDisplay = false
) => {
  const { proposal } = props;
  const forceRerender = useForceRerender();

  const votes = proposal.getVotes();

  useEffect(() => {
    app.proposalEmitter.on('redraw', forceRerender);

    return () => {
      app.proposalEmitter.removeAllListeners();
    };
  }, [forceRerender]);

  // handle aave separately
  if (proposal && proposal instanceof AaveProposal) {
    return <AaveProposalResult proposal={proposal} votes={votes} />;
  }

  // Map voting type to component
  const votingTypeToComponent = {
    [VotingType.SimpleYesNoVoting]: DefaultVotingResult,
    [VotingType.ConvictionYesNoVoting]: DefaultVotingResult,
    [VotingType.CompoundYesNo]: CompoundYesNoResult,
    [VotingType.CompoundYesNoAbstain]: CompoundYesNoAbstainResult,
    [VotingType.SimpleYesApprovalVoting]: SimpleYesApprovalResult,
    [VotingType.YesNoAbstainVeto]: YesNoAbstainVetoResult,
    [VotingType.YesNoReject]: YesNoRejectResult,
    [VotingType.RankedChoiceVoting]: null, // not implemented yet
  };

  const VotingComponent = votingTypeToComponent[proposal.votingType];

  if (!VotingComponent) {
    return null; // Handle unsupported voting types or default case
  }

  return (
    <VotingComponent
      proposal={proposal}
      votes={votes}
      inCardDisplay={inCardDisplay}
    />
  );
};
