import m from 'mithril';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { AnyProposal, IVote, VotingUnit } from 'models';
import { CosmosVote } from 'controllers/chain/cosmos/proposal';
import { CompoundProposalVote } from 'controllers/chain/ethereum/compound/proposal';
import { AaveProposalVote } from 'controllers/chain/ethereum/aave/proposal';

export const getBalance = (proposal: AnyProposal, vote: IVote<any>) => {
  const balancesCache = {};
  const balancesCacheInitialized = {};

  const balanceWeighted =
    proposal.votingUnit === VotingUnit.CoinVote ||
    proposal.votingUnit === VotingUnit.ConvictionCoinVote ||
    proposal.votingUnit === VotingUnit.PowerVote;

  let balance;

  if (balanceWeighted && !(vote instanceof CosmosVote)) {
    // fetch and display balances
    if (balancesCache[vote.account.address]) {
      balance = balancesCache[vote.account.address];
    } else if (balancesCacheInitialized[vote.account.address]) {
      // do nothing, fetch already in progress
      balance = '--';
    } else {
      // fetch balance and store in cache
      balancesCacheInitialized[vote.account.address] = true;

      if (vote instanceof AaveProposalVote) {
        balance = vote.power;
        balancesCache[vote.account.address] = vote.format();
        m.redraw();
      } else if (vote instanceof CompoundProposalVote) {
        balance = formatCoin(app.chain.chain.coins(vote.power), true);
        balancesCache[vote.account.address] = balance;
        m.redraw();
      } else {
        vote.account.balance.then((b) => {
          balance = b;
          balancesCache[vote.account.address] = formatCoin(b, true);
          m.redraw();
        });
        balance = '--';
      }
    }
  }

  return balance;
};
