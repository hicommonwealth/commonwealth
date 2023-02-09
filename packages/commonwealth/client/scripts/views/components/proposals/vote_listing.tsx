import React from 'react';

// TODO: remove formatCoin, only use coins.format()
import { formatCoin } from 'adapters/currency';
import { ClassComponent, ResultNode, redraw } from 'mithrilInterop';

import 'components/proposals/vote_listing.scss';
import { CosmosVote } from 'controllers/chain/cosmos/proposal';
import AaveProposal, {
  AaveProposalVote,
} from 'controllers/chain/ethereum/aave/proposal';
import { CompoundProposalVote } from 'controllers/chain/ethereum/compound/proposal';
import { MolochProposalVote } from 'controllers/chain/ethereum/moloch/proposal';
import { SubstrateDemocracyVote } from 'controllers/chain/substrate/democracy_referendum';
import type { AnyProposal, IVote } from 'models';
import { BinaryVote, DepositVote, VotingUnit } from 'models';

import app from 'state';
import { User } from '../../components/user/user';
import { CWText } from '../component_kit/cw_text';

type VoteListingAttrs = {
  proposal: AnyProposal;
  votes: Array<IVote<any>>;
};

export class VoteListing extends ClassComponent<VoteListingAttrs> {
  private balancesCache;
  private balancesCacheInitialized;

  view(vnode: ResultNode<VoteListingAttrs>) {
    const { proposal, votes } = vnode.attrs;

    const balanceWeighted =
      proposal.votingUnit === VotingUnit.CoinVote ||
      proposal.votingUnit === VotingUnit.ConvictionCoinVote ||
      proposal.votingUnit === VotingUnit.PowerVote;

    if (!this.balancesCache) this.balancesCache = {};
    if (!this.balancesCacheInitialized) this.balancesCacheInitialized = {};

    // TODO: show turnout if specific votes not found
    const sortedVotes = votes;

    if (proposal instanceof AaveProposal) {
      (sortedVotes as AaveProposalVote[]).sort((v1, v2) =>
        v2.power.cmp(v1.power)
      );
    }

    return (
      <div className="VoteListing">
        {sortedVotes.length === 0 ? (
          <CWText className="no-votes">No votes</CWText>
        ) : (
          votes.map((vote) => {
            let balance;

            if (balanceWeighted && !(vote instanceof CosmosVote)) {
              // fetch and display balances
              if (this.balancesCache[vote.account.address]) {
                balance = this.balancesCache[vote.account.address];
              } else if (this.balancesCacheInitialized[vote.account.address]) {
                // do nothing, fetch already in progress
                balance = '--';
              } else {
                // fetch balance and store in cache
                this.balancesCacheInitialized[vote.account.address] = true;
                if (vote instanceof AaveProposalVote) {
                  balance = vote.power;
                  this.balancesCache[vote.account.address] = vote.format();
                  redraw();
                } else if (vote instanceof CompoundProposalVote) {
                  balance = formatCoin(app.chain.chain.coins(vote.power), true);
                  this.balancesCache[vote.account.address] = balance;
                  redraw();
                } else {
                  vote.account.balance.then((b) => {
                    balance = b;
                    this.balancesCache[vote.account.address] = formatCoin(
                      b,
                      true
                    );
                    redraw();
                  });
                  balance = '--';
                }
              }
            }

            switch (true) {
              case vote instanceof CosmosVote:
                return (
                  <div className="vote">
                    <User user={vote.account} linkify popover />
                    {/* {balanceWeighted && balance && <CWText>{balance}</CWText>} */}
                  </div>
                );

              case vote instanceof MolochProposalVote:
                return (
                  <div className="vote">
                    <User user={vote.account} linkify />
                    {balance && typeof balance === 'string' && (
                      <div className="vote-right-container">
                        <CWText noWrap title={balance}>
                          {balance}
                        </CWText>
                      </div>
                    )}
                  </div>
                );

              case vote instanceof CompoundProposalVote:
                return (
                  <div className="vote">
                    <User user={vote.account} linkify />
                    {balance && typeof balance === 'string' && (
                      <div className="vote-right-container">
                        <CWText noWrap title={balance}>
                          {balance}
                        </CWText>
                      </div>
                    )}
                  </div>
                );

              case vote instanceof AaveProposalVote:
                return (
                  <div className="vote">
                    <User user={vote.account} linkify />
                    {balance && typeof balance === 'string' && (
                      <div className="vote-right-container">
                        <CWText noWrap title={balance}>
                          {balance}
                        </CWText>
                      </div>
                    )}
                  </div>
                );

              case vote instanceof BinaryVote:
                switch (true) {
                  case vote instanceof SubstrateDemocracyVote:
                    return (
                      <div className="vote">
                        <User user={vote.account} linkify popover />
                        <div className="vote-right-container">
                          <CWText
                            noWrap
                            title={formatCoin(
                              (vote as SubstrateDemocracyVote).balance,
                              true
                            )}
                          >
                            {formatCoin(
                              (vote as SubstrateDemocracyVote).balance,
                              true
                            )}
                          </CWText>
                          <CWText
                            noWrap
                            title={
                              (vote as SubstrateDemocracyVote).weight &&
                              `${(vote as SubstrateDemocracyVote).weight}x`
                            }
                          >
                            {(vote as SubstrateDemocracyVote).weight &&
                              `${(vote as SubstrateDemocracyVote).weight}x`}
                          </CWText>
                        </div>
                      </div>
                    );
                  default:
                    return (
                      <div className="vote">
                        <User user={vote.account} linkify popover />
                        <div className="vote-right-container">
                          <CWText
                            noWrap
                            title={(vote as any).amount && (vote as any).amount}
                          >
                            {(vote as any).amount && (vote as any).amount}
                          </CWText>
                          <CWText
                            noWrap
                            title={
                              (vote as any).weight && `${(vote as any).weight}x`
                            }
                          >
                            {(vote as any).weight && `${(vote as any).weight}x`}
                          </CWText>
                        </div>
                      </div>
                    );
                }

              case vote instanceof DepositVote:
                return (
                  <div className="vote">
                    <User user={vote.account} linkify popover />
                    <CWText>
                      {formatCoin((vote as DepositVote<any>).deposit, true)}
                    </CWText>
                  </div>
                );

              default:
                return (
                  <div className="vote">
                    <User user={vote.account} linkify popover />
                  </div>
                );
            }
          })
        )}
      </div>
    );
  }
}
