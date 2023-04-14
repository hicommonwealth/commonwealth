// TODO: remove formatCoin, only use coins.format()
import { formatCoin } from 'adapters/currency';

import 'components/proposals/vote_listing.scss';
import { CosmosVote } from 'controllers/chain/cosmos/proposal';
import AaveProposal, { AaveProposalVote, } from 'controllers/chain/ethereum/aave/proposal';
import { CompoundProposalVote } from 'controllers/chain/ethereum/compound/proposal';
import { SubstrateDemocracyVote } from 'controllers/chain/substrate/democracy_referendum';
import React from 'react';

import app from 'state';
import type { IVote } from '../../../models/interfaces';
import type { AnyProposal } from '../../../models/types';
import { VotingUnit } from '../../../models/types';
import { BinaryVote, DepositVote } from '../../../models/votes';
import { User } from '../../components/user/user';
import { CWText } from '../component_kit/cw_text';

const getBalance = (vote: IVote<any>) => {
  let balancesCache = {};
  let balancesCacheInitialized = {};
  let balance;

  if (balancesCache[vote.account.address]) {
    balance = balancesCache[vote.account.address];
  } else if (balancesCacheInitialized[vote.account.address]) {
    // do nothing, fetch already in progress
    balance = '--';
  } else {
    // fetch balance and store in cache
    balancesCacheInitialized = { [vote.account.address]: true };
    if (vote instanceof AaveProposalVote) {
      balance = vote.power;
      balancesCache = { [vote.account.address]: vote.format() };
    } else if (vote instanceof CompoundProposalVote) {
      balance = formatCoin(app.chain.chain.coins(vote.power), true);
      balancesCache = { [vote.account.address]: balance };
    } else {
      vote.account.balance.then((b) => {
        balance = b;
        balancesCache = {
          [vote.account.address]: formatCoin(b, true),
        };
      });
      balance = '--';
    }
  }

  return balance;
};

type VoteListingProps = {
  proposal: AnyProposal;
  votes: Array<IVote<any>>;
};

export const VoteListing = (props: VoteListingProps) => {
  const { proposal, votes } = props;

  const balanceWeighted =
    proposal.votingUnit === VotingUnit.CoinVote ||
    proposal.votingUnit === VotingUnit.ConvictionCoinVote ||
    proposal.votingUnit === VotingUnit.PowerVote;

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
        sortedVotes.map((vote, i) => {
          let balance;

          if (balanceWeighted && !(vote instanceof CosmosVote)) {
            // fetch and display balances
            balance = getBalance(vote);
          }

          switch (true) {
            case vote instanceof CosmosVote:
              return (
                <div className="vote" key={i}>
                  <User user={vote.account} linkify popover />
                  {balanceWeighted && balance && <CWText>{balance}</CWText>}
                </div>
              );
            case vote instanceof CompoundProposalVote:
              return (
                <div className="vote" key={i}>
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
                <div className="vote" key={i}>
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
                    <div className="vote" key={i}>
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
                    <div className="vote" key={i}>
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
                <div className="vote" key={i}>
                  <User user={vote.account} linkify popover />
                  <CWText>
                    {formatCoin((vote as DepositVote<any>).deposit, true)}
                  </CWText>
                </div>
              );

            default:
              return (
                <div className="vote" key={i}>
                  <User user={vote.account} linkify popover />
                </div>
              );
          }
        })
      )}
    </div>
  );
};
