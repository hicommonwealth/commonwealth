import BN from 'bn.js';
import React from 'react';
import Web3 from 'web3-utils';
import { formatNumberLong } from '../../../../../shared/adapters/currency';
import { AaveProposalVote } from '../../../controllers/chain/ethereum/aave/proposal';
import app from '../../../state/index';
import { AaveVotingResult } from './voting_result_components';

export function AaveProposalResult({ proposal, votes }) {
  const yesVotes: AaveProposalVote[] = votes.filter((v) => !!v.choice);

  const yesBalance = yesVotes.reduce(
    (total, v) => total.add(v.power),
    new BN(0)
  );

  const yesBalanceString = `${formatNumberLong(
    +Web3.fromWei(yesBalance.toString())
  )} ${app.chain.meta.default_symbol}`;

  const noVotes: AaveProposalVote[] = votes.filter((v) => !v.choice);

  const noBalance = noVotes.reduce((total, v) => total.add(v.power), new BN(0));

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
}
