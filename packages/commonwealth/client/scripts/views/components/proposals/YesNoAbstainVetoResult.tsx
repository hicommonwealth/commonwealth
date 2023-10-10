import BN from 'bn.js';
import React from 'react';
import { Coin } from '../../../../../shared/adapters/currency';
import { CosmosProposal } from '../../../controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import app from '../../../state/index';
import { CompletedProposalVotingResult } from './votingResults/CompletedProposalVotingResult';
import {
  YesNoAbstainVetoVotingResult,
  YesNoAbstainVetoVotingResultProps,
} from './votingResults/YesNoAbstainVetoVotingResult';

export const YesNoAbstainVetoResult = ({
  votes,
  proposal,
  isInCard,
}: YesNoAbstainVetoVotingResultProps) => {
  // return different voting results on completed cosmos proposal, as voters are not available
  if (proposal.completed && (proposal as CosmosProposal).data?.state?.tally) {
    const { yes, no, abstain, noWithVeto } = (proposal as CosmosProposal).data
      .state.tally;

    // TODO: move this marshalling into controller
    const formatCurrency = (n: BN) => {
      const decimals = new BN(10).pow(new BN(app.chain.meta.decimals || 6));
      const denom = app.chain.meta.default_symbol;
      const coin = new Coin(denom, n, false, decimals);
      return coin.format();
    };

    const voteTotal = yes.add(no).add(abstain).add(noWithVeto);

    const getPct = (n: BN) => {
      if (voteTotal.isZero()) return '0';
      return (n.muln(10_000).div(voteTotal)?.toNumber() / 100).toFixed(2);
    };

    return (
      <CompletedProposalVotingResult
        abstainPct={getPct(abstain)}
        abstainResults={formatCurrency(abstain)}
        noPct={getPct(no)}
        noResults={formatCurrency(no)}
        noWithVetoPct={getPct(noWithVeto)}
        noWithVetoResults={formatCurrency(noWithVeto)}
        yesPct={getPct(yes)}
        yesResults={formatCurrency(yes)}
        isInCard={isInCard}
      />
    );
  } else {
    return (
      <YesNoAbstainVetoVotingResult
        proposal={proposal as CosmosProposal}
        votes={votes}
        isInCard={isInCard}
      />
    );
  }
};
