import 'components/proposals/voting_results.scss';
import m from 'mithril';
import app from 'state';

import { formatCoin } from 'adapters/currency'; // TODO: remove formatCoin, only use coins.format()
import User from 'views/components/widgets/user';
import { VotingType, VotingUnit, IVote, DepositVote, BinaryVote, AnyProposal } from 'models';
import { CosmosVote, CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { CosmosVoteChoice } from 'adapters/chain/cosmos/types';
import { MolochProposalVote, MolochVote } from 'controllers/chain/ethereum/moloch/proposal';
import { MarlinProposalVote, MarlinVote } from 'controllers/chain/ethereum/marlin/proposal';
import { SubstrateCollectiveVote } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateDemocracyVote } from 'controllers/chain/substrate/democracy_referendum';
import { AaveProposalVote } from 'controllers/chain/ethereum/aave/proposal';
import Marlin from 'controllers/chain/ethereum/marlin/adapter';

const COLLAPSE_VOTERS_AFTER = 6; // if there are >6 voters, collapse remaining under "Show more"

const VoteListing: m.Component<{
  proposal: AnyProposal,
  votes : Array<IVote<any>>,
  amount?: boolean,
  weight?: boolean
}, {
  balancesCache,
  balancesCacheInitialized,
}> = {
  view: (vnode) => {
    const { proposal, votes, amount, weight } = vnode.attrs;
    const balanceWeighted = proposal.votingUnit === VotingUnit.CoinVote
      || proposal.votingUnit === VotingUnit.ConvictionCoinVote
      || proposal.votingUnit === VotingUnit.PowerVote;

    if (!vnode.state.balancesCache) vnode.state.balancesCache = {};
    if (!vnode.state.balancesCacheInitialized) vnode.state.balancesCacheInitialized = {};

    // TODO: show turnout if specific votes not found
    return m('.VoteListing', [
      votes.length === 0
        ? m('.no-votes', 'No votes')
        : votes.map(
          (vote) => {
            let balance;
            if (balanceWeighted && !(vote instanceof CosmosVote)) {
              // fetch and display balances
              if (vnode.state.balancesCache[vote.account.address]) {
                balance = vnode.state.balancesCache[vote.account.address];
              } else if (vnode.state.balancesCacheInitialized[vote.account.address]) {
                // do nothing, fetch already in progress
                balance = '--';
              } else {
                // fetch balance and store in cache
                vnode.state.balancesCacheInitialized[vote.account.address] = true;
                if (vote instanceof AaveProposalVote) {
                  balance = vote.power;
                  vnode.state.balancesCache[vote.account.address] = vote.format();
                  m.redraw();
                } else if (vote instanceof MarlinProposalVote) {
                  (app.chain as Marlin).chain.balanceOf(vote.account.address).then((b) => {
                    balance = b;
                    vnode.state.balancesCache[vote.account.address] = formatCoin(app.chain.chain.coins(b), true);
                    m.redraw();
                  });
                  balance = '--';
                } else {
                  vote.account.balance.then((b) => {
                    balance = b;
                    vnode.state.balancesCache[vote.account.address] = formatCoin(b, true);
                    m.redraw();
                  });
                  balance = '--';
                }
              }
            }
            switch (true) {
              case (vote instanceof CosmosVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                  // (balanceWeighted && balance) && m('.vote-balance', balance),
                ]);
              case (vote instanceof MolochProposalVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true })),
                  balance && m('.vote-balance', balance),
                ]);
              case (vote instanceof MarlinProposalVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true })),
                  balance && m('.vote-balance', balance),
                ]);
              case (vote instanceof AaveProposalVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true })),
                  balance && m('.vote-balance', balance),
                ]);
              case (vote instanceof BinaryVote):
                switch (true) {
                  case (vote instanceof SubstrateDemocracyVote):
                    return m('.vote', [
                      m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                      m('.vote-balance', formatCoin((vote as SubstrateDemocracyVote).balance, true)),
                      m('.vote-weight', (vote as SubstrateDemocracyVote).weight
                        && `${(vote as SubstrateDemocracyVote).weight}x`),
                    ]);
                  case (vote instanceof SubstrateCollectiveVote):
                    return m('.vote', [
                      m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                    ]);
                  default:
                    return m('.vote', [
                      m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                      m('.vote-balance', (vote as any).amount && (vote as any).amount),
                      m('.vote-weight', (vote as any).weight && `${(vote as any).weight}x`),
                    ]);
                }
              case (vote instanceof DepositVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                  m('.vote-deposit', formatCoin((vote as DepositVote<any>).deposit, true)),
                ]);
              default:
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                ]);
            }
          }
        ),
    ]);
  }
};

const VotingResults: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const votes = proposal.getVotes();

    // TODO: fix up this function for cosmos votes
    if (proposal.votingType === VotingType.SimpleYesNoVoting) {
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Yes (${votes.filter((v) => v.choice === true).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === true)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `No (${votes.filter((v) => v.choice === false).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === false)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.MolochYesNo) {
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Yes (${votes.filter((v) => v.choice === MolochVote.YES).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MolochVote.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `No (${votes.filter((v) => v.choice === MolochVote.NO).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MolochVote.NO)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.MarlinYesNo) {
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', `Yes (${votes.filter((v) => v.choice === MarlinVote.YES).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MarlinVote.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `No (${votes.filter((v) => v.choice === MarlinVote.NO).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MarlinVote.NO)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Yes (${votes.filter((v) => v.choice === true).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === true),
              amount: true,
              weight: true
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `No (${votes.filter((v) => v.choice === false).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === false),
              amount: true,
              weight: true
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Yes (${votes.filter((v) => v.choice === CosmosVoteChoice.YES).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `No (${votes.filter((v) => v.choice === CosmosVoteChoice.NO).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.NO)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Abstained (${votes.filter((v) => v.choice === CosmosVoteChoice.ABSTAIN).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.ABSTAIN)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `No with veto (${votes.filter((v) => v.choice === CosmosVoteChoice.VETO).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.VETO)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting
               && proposal instanceof CosmosProposal) {
      // special case for cosmos proposals in deposit stage
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Approved ${proposal.depositorsAsVotes.length}`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: proposal.depositorsAsVotes
            })
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Approved ${votes.length}`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes
            })
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.RankedChoiceVoting) {
      // to be implemented
    } else {
      // to be implemented
    }
  }
};

export default VotingResults;
