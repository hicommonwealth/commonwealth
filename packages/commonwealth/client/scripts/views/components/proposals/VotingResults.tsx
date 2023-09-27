import React, { useEffect, useState } from 'react';

import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import type { AnyProposal } from '../../../models/types';
import { VotingType } from '../../../models/types';

import app from 'state';
import { AaveProposalResult } from './VotingResults/AaveProposalResult';
import { SimpleYesApprovalResult } from './VotingResults/SimpleYesApprovalResult';
import useForceRerender from 'hooks/useForceRerender';
import { CompoundYesNoAbstainResult } from './votingResults/CompoundYesNoAbstainResult';
import { CompoundYesNoResult } from './votingResults/CompoundYesNoResult';
import { DefaultVotingResult } from './votingResults/DefaultVotingResult';
import { YesNoAbstainVetoResult } from './YesNoAbstainVetoResult';
import { YesNoRejectResult } from './votingResults/YesNoRejectResult';
import { useAaveProposalVotesQuery } from 'state/api/proposals';
import { ChainNetwork } from 'common-common/src/types';

type VotingResultsProps = { proposal: AnyProposal; isInCard: boolean };

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

export const VotingResults = (props: VotingResultsProps) => {
  const { proposal, isInCard } = props;
  const forceRerender = useForceRerender();
  const [isLoading, setLoading] = useState(
    !app.chain || !app.chain.loaded || !app.chain.apiInitialized
  );

  useEffect(() => {
    const listener = () => setLoading(false);
    app.chainAdapterReady.on('ready', listener);

    return () => {
      app.chainAdapterReady.off('ready', listener);
    };
  }, []);

  useEffect(() => {
    app.proposalEmitter.on('redraw', forceRerender);

    return () => {
      app.proposalEmitter.removeAllListeners();
    };
  }, [forceRerender]);

  const { data } = useAaveProposalVotesQuery({
    moduleReady: app.chain?.network === ChainNetwork.Aave && !isLoading,
    chainId: app.chain?.id,
    proposalId: proposal.identifier,
  });

  const votes = data || proposal.getVotes();

  // handle aave separately
  if (proposal && proposal instanceof AaveProposal) {
    return (
      <AaveProposalResult
        proposal={proposal}
        votes={votes}
        isInCard={isInCard}
      />
    );
  }

  const VotingComponent = votingTypeToComponent[proposal.votingType];

  if (!VotingComponent) {
    return null; // Handle unsupported voting types or default case
  }

  return (
    <VotingComponent proposal={proposal} votes={votes} isInCard={isInCard} />
  );
};
