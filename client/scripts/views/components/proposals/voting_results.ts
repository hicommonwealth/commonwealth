import 'components/proposals/voting_results.scss';
import m from 'mithril';
import app from 'state';
import BN from 'bn.js';
import Web3 from 'web3';

import { formatCoin, formatNumberLong, Coin } from 'adapters/currency'; // TODO: remove formatCoin, only use coins.format()
import User from 'views/components/widgets/user';
import {
  VotingType,
  VotingUnit,
  IVote,
  DepositVote,
  BinaryVote,
  AnyProposal,
} from 'models';
import { CosmosVote, CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { CosmosVoteChoice } from 'controllers/chain/cosmos/types';
import {
  MolochProposalVote,
  MolochVote,
} from 'controllers/chain/ethereum/moloch/proposal';
import {
  CompoundProposalVote,
  BravoVote,
} from 'controllers/chain/ethereum/compound/proposal';
import { SubstrateCollectiveVote } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateDemocracyVote } from 'controllers/chain/substrate/democracy_referendum';
import AaveProposal, {
  AaveProposalVote,
} from 'controllers/chain/ethereum/aave/proposal';
import { NearSputnikVoteString } from 'controllers/chain/near/sputnik/types';

const COLLAPSE_VOTERS_AFTER = 6; // if there are >6 voters, collapse remaining under "Show more"

const VoteListing: m.Component<
  {
    proposal: AnyProposal;
    votes: Array<IVote<any>>;
    amount?: boolean;
    weight?: boolean;
  },
  {
    balancesCache;
    balancesCacheInitialized;
  }
> = {
  view: (vnode) => {
    const { proposal, votes, amount, weight } = vnode.attrs;
    const balanceWeighted =
      proposal.votingUnit === VotingUnit.CoinVote ||
      proposal.votingUnit === VotingUnit.ConvictionCoinVote ||
      proposal.votingUnit === VotingUnit.PowerVote;

    if (!vnode.state.balancesCache) vnode.state.balancesCache = {};
    if (!vnode.state.balancesCacheInitialized)
      vnode.state.balancesCacheInitialized = {};

    // TODO: show turnout if specific votes not found
    const sortedVotes = votes;
    if (proposal instanceof AaveProposal) {
      (sortedVotes as AaveProposalVote[]).sort((v1, v2) =>
        v2.power.cmp(v1.power)
      );
    }
    return m('.VoteListing', [
      sortedVotes.length === 0
        ? m('.no-votes', 'No votes')
        : votes.map((vote) => {
            let balance;
            if (balanceWeighted && !(vote instanceof CosmosVote)) {
              // fetch and display balances
              if (vnode.state.balancesCache[vote.account.address]) {
                balance = vnode.state.balancesCache[vote.account.address];
              } else if (
                vnode.state.balancesCacheInitialized[vote.account.address]
              ) {
                // do nothing, fetch already in progress
                balance = '--';
              } else {
                // fetch balance and store in cache
                vnode.state.balancesCacheInitialized[vote.account.address] =
                  true;
                if (vote instanceof AaveProposalVote) {
                  balance = vote.power;
                  vnode.state.balancesCache[vote.account.address] =
                    vote.format();
                  m.redraw();
                } else if (vote instanceof CompoundProposalVote) {
                  balance = formatCoin(app.chain.chain.coins(vote.power), true);
                  vnode.state.balancesCache[vote.account.address] = balance;
                  m.redraw();
                } else {
                  vote.account.balance.then((b) => {
                    balance = b;
                    vnode.state.balancesCache[vote.account.address] =
                      formatCoin(b, true);
                    m.redraw();
                  });
                  balance = '--';
                }
              }
            }
            switch (true) {
              case vote instanceof CosmosVote:
                return m('.vote', [
                  m(
                    '.vote-voter',
                    m(User, {
                      user: vote.account,
                      linkify: true,
                      popover: true,
                    })
                  ),
                  // (balanceWeighted && balance) && m('.vote-balance', balance),
                ]);
              case vote instanceof MolochProposalVote:
                return m('.vote', [
                  m(
                    '.vote-voter',
                    m(User, { user: vote.account, linkify: true })
                  ),
                  balance && m('.vote-balance', balance),
                ]);
              case vote instanceof CompoundProposalVote:
                return m('.vote', [
                  m(
                    '.vote-voter',
                    m(User, { user: vote.account, linkify: true })
                  ),
                  balance && m('.vote-balance', balance),
                ]);
              case vote instanceof AaveProposalVote:
                return m('.vote', [
                  m(
                    '.vote-voter',
                    m(User, { user: vote.account, linkify: true })
                  ),
                  balance && m('.vote-balance', balance),
                ]);
              case vote instanceof BinaryVote:
                switch (true) {
                  case vote instanceof SubstrateDemocracyVote:
                    return m('.vote', [
                      m(
                        '.vote-voter',
                        m(User, {
                          user: vote.account,
                          linkify: true,
                          popover: true,
                        })
                      ),
                      m(
                        '.vote-balance',
                        formatCoin(
                          (vote as SubstrateDemocracyVote).balance,
                          true
                        )
                      ),
                      m(
                        '.vote-weight',
                        (vote as SubstrateDemocracyVote).weight &&
                          `${(vote as SubstrateDemocracyVote).weight}x`
                      ),
                    ]);
                  case vote instanceof SubstrateCollectiveVote:
                    return m('.vote', [
                      m(
                        '.vote-voter',
                        m(User, {
                          user: vote.account,
                          linkify: true,
                          popover: true,
                        })
                      ),
                    ]);
                  default:
                    return m('.vote', [
                      m(
                        '.vote-voter',
                        m(User, {
                          user: vote.account,
                          linkify: true,
                          popover: true,
                        })
                      ),
                      m(
                        '.vote-balance',
                        (vote as any).amount && (vote as any).amount
                      ),
                      m(
                        '.vote-weight',
                        (vote as any).weight && `${(vote as any).weight}x`
                      ),
                    ]);
                }
              case vote instanceof DepositVote:
                return m('.vote', [
                  m(
                    '.vote-voter',
                    m(User, {
                      user: vote.account,
                      linkify: true,
                      popover: true,
                    })
                  ),
                  m(
                    '.vote-deposit',
                    formatCoin((vote as DepositVote<any>).deposit, true)
                  ),
                ]);
              default:
                return m('.vote', [
                  m(
                    '.vote-voter',
                    m(User, {
                      user: vote.account,
                      linkify: true,
                      popover: true,
                    })
                  ),
                ]);
            }
          }),
    ]);
  },
};

const VotingResults: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const votes = proposal.getVotes();

    // TODO: fix up this function for cosmos votes
    if (proposal.votingType === VotingType.SimpleYesNoVoting) {
      return m('.VotingResults', [
        m('.results-column.yes-votes', [
          m(
            '.results-header',
            `Yes (${votes.filter((v) => v.choice === true).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === true),
            }),
          ]),
        ]),
        m('.results-column.no-votes', [
          m(
            '.results-header',
            `No (${votes.filter((v) => v.choice === false).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === false),
            }),
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.MolochYesNo) {
      return m('.VotingResults', [
        m('.results-column.yes-votes', [
          m(
            '.results-header',
            `Yes (${votes.filter((v) => v.choice === MolochVote.YES).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MolochVote.YES),
            }),
          ]),
        ]),
        m('.results-column.no-votes', [
          m(
            '.results-header',
            `No (${votes.filter((v) => v.choice === MolochVote.NO).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MolochVote.NO),
            }),
          ]),
        ]),
      ]);
    } else if (proposal instanceof AaveProposal) {
      const yesVotes: AaveProposalVote[] = votes.filter((v) => !!v.choice);
      const yesBalance = yesVotes.reduce(
        (total, v) => total.add(v.power),
        new BN(0)
      );
      const yesBalanceString = `${formatNumberLong(
        +Web3.utils.fromWei(yesBalance.toString())
      )} ${app.chain.meta.chain.symbol}`;
      const noVotes: AaveProposalVote[] = votes.filter((v) => !v.choice);
      const noBalance = noVotes.reduce(
        (total, v) => total.add(v.power),
        new BN(0)
      );
      const noBalanceString = `${formatNumberLong(
        +Web3.utils.fromWei(noBalance.toString())
      )} ${app.chain.meta.chain.symbol}`;
      return m('.VotingResults', [
        m('.results-column.yes-votes', [
          m(
            '.results-header',
            `Yes (${yesBalanceString}) (${yesVotes.length} voters)`
          ),
          m('.results-subheader', [m('span', 'User'), m('span', 'Power')]),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => !!v.choice),
            }),
          ]),
        ]),
        m('.results-column.no-votes', [
          m(
            '.results-header',
            `No (${noBalanceString}) (${noVotes.length} voters)`
          ),
          m('.results-subheader', [m('span', 'User'), m('span', 'Power')]),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => !v.choice),
            }),
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.CompoundYesNo) {
      return m('.VotingResults', [
        m('.results-column.yes-votes', [
          m(
            '.results-header',
            `Yes (${votes.filter((v) => v.choice === BravoVote.YES).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === BravoVote.YES),
            }),
          ]),
        ]),
        m('.results-column.no-votes', [
          m(
            '.results-header',
            `No (${votes.filter((v) => v.choice === BravoVote.NO).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === BravoVote.NO),
            }),
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.CompoundYesNoAbstain) {
      return m('.VotingResults', [
        m('.results-column.yes-votes', [
          m(
            '.results-header',
            `Yes (${votes.filter((v) => v.choice === BravoVote.YES).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === BravoVote.YES),
            }),
          ]),
        ]),
        m('.results-column.no-votes', [
          m(
            '.results-header',
            `No (${votes.filter((v) => v.choice === BravoVote.NO).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === BravoVote.NO),
            }),
          ]),
        ]),
        m('.results-column.no-votes', [
          m(
            '.results-header',
            `Abstain (${
              votes.filter((v) => v.choice === BravoVote.ABSTAIN).length
            })`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === BravoVote.ABSTAIN),
            }),
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      return m('.VotingResults', [
        m('.results-column.yes-votes', [
          m(
            '.results-header',
            `Yes (${votes.filter((v) => v.choice === true).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === true),
              amount: true,
              weight: true,
            }),
          ]),
        ]),
        m('.results-column.no-votes', [
          m(
            '.results-header',
            `No (${votes.filter((v) => v.choice === false).length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === false),
              amount: true,
              weight: true,
            }),
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      // return different voting results on completed cosmos proposal, as voters are not available
      if (
        proposal.completed &&
        (proposal as CosmosProposal).data?.state?.tally
      ) {
        const { yes, no, abstain, noWithVeto } = (proposal as CosmosProposal)
          .data.state.tally;

        // TODO: move this marshalling into controller
        const formatCurrency = (n: BN) => {
          const decimals = new BN(10).pow(
            new BN(app.chain.meta.chain.decimals || 6)
          );
          const denom = app.chain.meta.chain.symbol;
          const coin = new Coin(denom, n, false, decimals);
          return coin.format();
        };
        const voteTotal = yes.add(no).add(abstain).add(noWithVeto);
        const getPct = (n: BN) => {
          return (n.muln(10_000).div(voteTotal).toNumber() / 100).toFixed(2);
        };
        return m('.VotingResults', [
          m('.results-column', [
            m('.results-header', `${getPct(yes)}% voted Yes`),
            m('.results-cell', `(${formatCurrency(yes)})`),
          ]),
          m('.results-column', [
            m('.results-header', `${getPct(no)}% voted No`),
            m('.results-cell', `(${formatCurrency(no)})`),
          ]),
          m('.results-column', [
            m('.results-header', `${getPct(abstain)}% voted Abstain`),
            m('.results-cell', `(${formatCurrency(abstain)})`),
          ]),
          m('.results-column', [
            m('.results-header', `${getPct(noWithVeto)}% voted Veto`),
            m('.results-cell', `(${formatCurrency(noWithVeto)})`),
          ]),
        ]);
      }
      return m('.VotingResults', [
        m('.results-column', [
          m(
            '.results-header',
            `Voted yes (${votes.filter((v) => v.choice === 'Yes').length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === 'Yes'),
            }),
          ]),
        ]),
        m('.results-column', [
          m(
            '.results-header',
            `Voted no (${votes.filter((v) => v.choice === 'No').length})`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === 'No'),
            }),
          ]),
        ]),
        m('.results-column', [
          m(
            '.results-header',
            `Voted abstain (${
              votes.filter((v) => v.choice === 'Abstain').length
            })`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === 'Abstain'),
            }),
          ]),
        ]),
        m('.results-column', [
          m(
            '.results-header',
            `Voted veto (${
              votes.filter((v) => v.choice === 'NoWithVeto').length
            })`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === 'NoWithVeto'),
            }),
          ]),
        ]),
      ]);
    } else if (
      proposal.votingType === VotingType.SimpleYesApprovalVoting &&
      proposal instanceof CosmosProposal
    ) {
      // special case for cosmos proposals in deposit stage
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Approved ${proposal.depositorsAsVotes.length}`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: proposal.depositorsAsVotes,
            }),
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
              votes,
            }),
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.YesNoReject) {
      return m('.VotingResults', [
        m('.results-column', [
          m(
            '.results-header',
            `Voted approve (${
              votes.filter((v) => v.choice === NearSputnikVoteString.Approve)
                .length
            })`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter(
                (v) => v.choice === NearSputnikVoteString.Approve
              ),
            }),
          ]),
        ]),
        m('.results-column', [
          m(
            '.results-header',
            `Voted reject (${
              votes.filter((v) => v.choice === NearSputnikVoteString.Reject)
                .length
            })`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter(
                (v) => v.choice === NearSputnikVoteString.Reject
              ),
            }),
          ]),
        ]),
        m('.results-column', [
          m(
            '.results-header',
            `Voted remove (${
              votes.filter((v) => v.choice === NearSputnikVoteString.Remove)
                .length
            })`
          ),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter(
                (v) => v.choice === NearSputnikVoteString.Remove
              ),
            }),
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.RankedChoiceVoting) {
      // to be implemented
    } else {
      // to be implemented
    }
  },
};

export default VotingResults;
