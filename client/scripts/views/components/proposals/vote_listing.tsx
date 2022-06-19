/* @jsx m */

import m from 'mithril';

import 'components/proposals/vote_listing.scss';

// TODO: remove formatCoin, only use coins.format()
import { formatCoin } from 'adapters/currency';
import User from 'views/components/widgets/user';
import { IVote, DepositVote, BinaryVote, AnyProposal } from 'models';
import { CosmosVote } from 'controllers/chain/cosmos/proposal';
import { MolochProposalVote } from 'controllers/chain/ethereum/moloch/proposal';
import { CompoundProposalVote } from 'controllers/chain/ethereum/compound/proposal';
import { SubstrateCollectiveVote } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateDemocracyVote } from 'controllers/chain/substrate/democracy_referendum';
import AaveProposal, {
  AaveProposalVote,
} from 'controllers/chain/ethereum/aave/proposal';
import { CWText } from '../component_kit/cw_text';
import { getBalance } from './helpers';

type VoteListingAttrs = {
  amount?: boolean;
  proposal: AnyProposal;
  votes: Array<IVote<any>>;
  weight?: boolean;
};

export class VoteListing implements m.ClassComponent<VoteListingAttrs> {
  view(vnode) {
    const { proposal, votes } = vnode.attrs;

    // TODO: show turnout if specific votes not found
    const sortedVotes = votes;

    if (proposal instanceof AaveProposal) {
      (sortedVotes as AaveProposalVote[]).sort((v1, v2) =>
        v2.power.cmp(v1.power)
      );
    }

    return (
      <div class="VoteListing">
        {sortedVotes.length === 0 ? (
          <CWText className="no-votes">No votes</CWText>
        ) : (
          votes.map((vote) => {
            const balance = getBalance(proposal, vote);

            switch (true) {
              case vote instanceof CosmosVote:
                return (
                  <div class="vote">
                    {m(User, {
                      user: vote.account,
                      linkify: true,
                      popover: true,
                    })}
                    {/* {balanceWeighted && balance && <CWText>{balance}</CWText>} */}
                  </div>
                );

              case vote instanceof MolochProposalVote:
                return (
                  <div class="vote">
                    {m(User, { user: vote.account, linkify: true })}
                    {balance && <CWText>{balance}</CWText>}
                  </div>
                );

              case vote instanceof CompoundProposalVote:
                return (
                  <div class="vote">
                    {m(User, { user: vote.account, linkify: true })}
                    {balance && <CWText>{balance}</CWText>}
                  </div>
                );

              case vote instanceof AaveProposalVote:
                return (
                  <div class="vote">
                    {m(User, { user: vote.account, linkify: true })}
                    {balance && <CWText>{balance}</CWText>}
                  </div>
                );

              case vote instanceof BinaryVote:
                switch (true) {
                  case vote instanceof SubstrateDemocracyVote:
                    return (
                      <div class="vote">
                        {m(User, {
                          user: vote.account,
                          linkify: true,
                          popover: true,
                        })}
                        <div class="vote-right-container">
                          <CWText noWrap>
                            {formatCoin(
                              (vote as SubstrateDemocracyVote).balance,
                              true
                            )}
                          </CWText>
                          <CWText noWrap>
                            {(vote as SubstrateDemocracyVote).weight &&
                              `${(vote as SubstrateDemocracyVote).weight}x`}
                          </CWText>
                        </div>
                      </div>
                    );

                  case vote instanceof SubstrateCollectiveVote:
                    return (
                      <div class="vote">
                        {m(User, {
                          user: vote.account,
                          linkify: true,
                          popover: true,
                        })}
                      </div>
                    );

                  default:
                    return (
                      <div class="vote">
                        {m(User, {
                          user: vote.account,
                          linkify: true,
                          popover: true,
                        })}
                        <div class="vote-right-container">
                          <CWText noWrap>
                            {(vote as any).amount && (vote as any).amount}
                          </CWText>
                          <CWText noWrap>
                            {(vote as any).weight && `${(vote as any).weight}x`}
                          </CWText>
                        </div>
                      </div>
                    );
                }

              case vote instanceof DepositVote:
                return (
                  <div class="vote">
                    {m(User, {
                      user: vote.account,
                      linkify: true,
                      popover: true,
                    })}
                    <CWText>
                      {formatCoin((vote as DepositVote<any>).deposit, true)}
                    </CWText>
                  </div>
                );

              default:
                return (
                  <div class="vote">
                    {m(User, {
                      user: vote.account,
                      linkify: true,
                      popover: true,
                    })}
                  </div>
                );
            }
          })
        )}
      </div>
    );
  }
}
