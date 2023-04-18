import React from 'react';

import { Coin, formatNumberLong } from 'adapters/currency';
import BN from 'bn.js';
import { CosmosProposal } from 'controllers/chain/cosmos/proposal';
import type { AaveProposalVote } from 'controllers/chain/ethereum/aave/proposal';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { BravoVote } from 'controllers/chain/ethereum/compound/proposal';
import type NearSputnikProposal from 'controllers/chain/near/sputnik/proposal';
import type { AnyProposal } from 'models';
import { VotingType } from 'models';

import app from 'state';
import Web3 from 'web3-utils';
import {
  AaveVotingResult,
  CompletedProposalVotingResult,
  SimpleYesApprovalVotingResult,
  VotingResult,
  YesNoAbstainVetoVotingResult,
  YesNoRejectVotingResult,
} from './voting_result_components';

type VotingResultsProps = { proposal: AnyProposal };

export const VotingResults = (props: VotingResultsProps) => {
  const { proposal } = props;

  const votes = proposal.getVotes();

  // TODO: fix up this function for cosmos votes
  if (
    proposal.votingType === VotingType.SimpleYesNoVoting ||
    proposal.votingType === VotingType.ConvictionYesNoVoting
  ) {
    return (
      <VotingResult
        yesVotes={votes.filter((v) => v.choice === true)}
        noVotes={votes.filter((v) => v.choice === false)}
        proposal={proposal}
      />
    );
  } else if (proposal.votingType === VotingType.CompoundYesNo) {
    return (
      <VotingResult
        yesVotes={votes.filter((v) => v.choice === BravoVote.YES)}
        noVotes={votes.filter((v) => v.choice === BravoVote.NO)}
        proposal={proposal}
      />
    );
  } else if (proposal.votingType === VotingType.CompoundYesNoAbstain) {
    return (
      <VotingResult
        abstainVotes={votes.filter((v) => v.choice === BravoVote.ABSTAIN)}
        yesVotes={votes.filter((v) => v.choice === BravoVote.YES)}
        noVotes={votes.filter((v) => v.choice === BravoVote.NO)}
        proposal={proposal}
      />
    );
  } else if (
    proposal.votingType === VotingType.SimpleYesApprovalVoting &&
    proposal instanceof CosmosProposal
  ) {
    // special case for cosmos proposals in deposit stage
    return (
      <SimpleYesApprovalVotingResult
        approvedCount={proposal.depositorsAsVotes.length}
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
  } else if (proposal instanceof AaveProposal) {
    const yesVotes: AaveProposalVote[] = votes.filter((v) => !!v.choice);

    const yesBalance = yesVotes.reduce(
      (total, v) => total.add(v.power),
      new BN(0)
    );

    const yesBalanceString = `${formatNumberLong(
      +Web3.fromWei(yesBalance.toString())
    )} ${app.chain.meta.default_symbol}`;

    const noVotes: AaveProposalVote[] = votes.filter((v) => !v.choice);

    const noBalance = noVotes.reduce(
      (total, v) => total.add(v.power),
      new BN(0)
    );

    const noBalanceString = `${formatNumberLong(
      +Web3.fromWei(noBalance.toString())
    )} ${app.chain.meta.default_symbol}`;

    return (
      <AaveVotingResult
        noBalanceString={noBalanceString}
        noVotesCount={noVotes.length}
        proposal={proposal}
        votes={votes}
        yesBalanceString={yesBalanceString}
        yesVotesCount={yesVotes.length}
      />
    );
  } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
    // return different voting results on completed cosmos proposal, as voters are not available
    if (proposal.completed && (proposal as CosmosProposal).data?.state?.tally) {
      const {
        yes,
        no,
        abstain,
        noWithVeto,
      } = (proposal as CosmosProposal)?.data?.state?.tally;

      // TODO: move this marshalling into controller
      const formatCurrency = (n: BN) => {
        const decimals = new BN(10).pow(new BN(app.chain.meta.decimals || 6));
        const denom = app.chain.meta.default_symbol;
        const coin = new Coin(denom, n, false, decimals);
        return coin.format();
      };

      const voteTotal = yes.add(no).add(abstain).add(noWithVeto);

      const getPct = (n: BN) => {
        if (voteTotal?.isZero()) return '0';
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
  } else if (proposal.votingType === VotingType.YesNoReject) {
    return (
      <YesNoRejectVotingResult
        proposal={proposal as NearSputnikProposal}
        votes={votes}
      />
    );
  } else if (proposal.votingType === VotingType.RankedChoiceVoting) {
    // to be implemented
    return null;
  } else {
    // to be implemented
    return null;
  }
};
