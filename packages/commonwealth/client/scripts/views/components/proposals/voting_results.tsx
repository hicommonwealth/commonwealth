import React, { useEffect, useState } from 'react';

import { Coin } from 'adapters/currency';
import BN from 'bn.js';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import type { AnyProposal } from '../../../models/types';
import { VotingType } from '../../../models/types';

import { getChainDecimals } from 'client/scripts/controllers/app/webWallets/utils';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import app from 'state';
import GovernanceVote from './GoveranceVote';
import {
  SimpleYesApprovalVotingResult,
  YesNoAbstainVetoVotingResult,
} from './voting_result_components';

type VotingResultsProps = { proposal: AnyProposal };
interface VoteOption {
  label: string;
  percentage: string;
  results: string;
}
export const VotingResults = (props: VotingResultsProps) => {
  const { proposal } = props;
  console.log({ result: proposal });
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
  // TODO: fix up this function for cosmos votes
  if (
    proposal.votingType === VotingType.SimpleYesApprovalVoting &&
    (proposal instanceof CosmosProposal || proposal instanceof CosmosProposalV1)
  ) {
    // special case for cosmos proposals in deposit stage
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
      const formatCurrency = (n: BN) => {
        const decimals = new BN(10).pow(
          new BN(
            getChainDecimals(app.chain.id || '', app.chain.meta.base) || 6,
          ),
        );
        const denom = app.chain.meta?.default_symbol;
        const coin = new Coin(denom, n, false, decimals);
        return coin.format();
      };

      const getPct = (n: BN, voteTotal: BN) => {
        if (voteTotal.isZero()) return '0';
        return (n.muln(10_000).div(voteTotal)?.toNumber() / 100).toFixed(2);
      };
      const voteTotal = yes.add(no).add(abstain).add(noWithVeto);
      const voteOptions: VoteOption[] = [
        {
          label: 'Yes',
          percentage: getPct(yes, voteTotal),
          results: formatCurrency(yes),
        },
        {
          label: 'No',
          percentage: getPct(no, voteTotal),
          results: formatCurrency(no),
        },
        {
          label: 'Abstain',
          percentage: getPct(abstain, voteTotal),
          results: formatCurrency(abstain),
        },
        {
          label: 'No with Veto',
          percentage: getPct(noWithVeto, voteTotal),
          results: formatCurrency(noWithVeto),
        },
      ];

      return (
        <>
          <GovernanceVote
            voteOptions={voteOptions}
            quorum={60} // Adjust based on your governance rules
            governanceType="Cosmos Proposal"
            barColor="#3366cc" // Uniform color for all bars
          />
          {/* <GovernanceVote
            abstainPct={getPct(abstain)}
            abstainResults={formatCurrency(abstain)}
            noPct={getPct(no)}
            noResults={formatCurrency(no)}
            noWithVetoPct={getPct(noWithVeto)}
            noWithVetoResults={formatCurrency(noWithVeto)}
            yesPct={getPct(yes)}
            yesResults={formatCurrency(yes)}
          /> */}
        </>
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
