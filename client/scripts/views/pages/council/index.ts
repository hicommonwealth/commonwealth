import 'pages/council.scss';

import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import app, { ApiStatus } from 'state';
import { ProposalType } from 'identifiers';
import { formatNumberLong, pluralize, link } from 'helpers';
import { formatCoin } from 'adapters/currency';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { ChainBase, ChainClass, IVote } from 'models';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_election';
import Sublayout from 'views/sublayout';
import User, { UserBlock } from 'views/components/widgets/user';
import { CountdownUntilBlock } from 'views/components/countdown';
import NewProposalPage from 'views/pages/new_proposal/index';
import { createTXModal } from 'views/modals/tx_signing_modal';
import CouncilVotingModal from 'views/modals/council_voting_modal';
import PageLoading from 'views/pages/loading';
import ViewVotersModal from 'views/modals/view_voters_modal';
import { Grid, Col, Button, MenuItem } from 'construct-ui';
import CouncilRow from './council_row';
import ListingHeader from '../../components/listing_header';
import Listing from '../listing';
import ErrorPage from '../error';

interface ICouncilElectionVoterAttrs {
  vote: PhragmenElectionVote;
}

const CouncilElectionVoter: m.Component<ICouncilElectionVoterAttrs> = {
  view: (vnode) => {
    const myAccount = app.user.activeAccount as SubstrateAccount;
    const voter = vnode.attrs.vote as PhragmenElectionVote;
    const voterAccount: SubstrateAccount = voter.account;
    const canBeReaped: boolean = (app.chain as Substrate).phragmenElections.activeElection.isDefunctVoter(voterAccount);
    const isPresentationPhase: boolean = false;
    const lastActive: number = null;
    const stake: string = voter.stake.format();
    const canBeRetracted = app.user.activeAccount && voterAccount.address === myAccount.address;

    return link('a.CouncilElectionVoter', `/${voterAccount.chain.id}/account/${voterAccount.address}`, [
      m('.col-member', m(UserBlock, { user: voterAccount })),
      m('.col-info', [
        m('.metadata-item', `Locked ${stake}`),
        (canBeReaped || canBeRetracted) && m('a', {
          href: '#',
          class: (isPresentationPhase || !app.user.activeAccount) ? 'disabled' : '',
          onclick: (e) => {
            e.preventDefault();
            if (canBeRetracted) {
              createTXModal((app.chain as Substrate).phragmenElections.activeElection.removeVoterTx(myAccount));
            } else if (canBeReaped) {
              createTXModal(
                (app.chain as Substrate).phragmenElections.activeElection
                  .reportDefunctVoterTx(myAccount, voterAccount)
              );
            }
          }
        }, [
          isPresentationPhase ? 'Can only claim in voting phase'
            : canBeRetracted ? 'Retract vote'
              : 'Reap vote to claim bond'
        ]),
      ]),
    ]);
  }
};

export const CollectiveVotingButton: m.Component<{
  candidates: Array<[SubstrateAccount, number]>,
  menuStyle?: boolean,
  buttonStyle?: boolean
}> = {
  view: (vnode) => {
    const { buttonStyle, candidates, menuStyle } = vnode.attrs;
    return menuStyle
      ? m(MenuItem, {
        disabled: !app.user.activeAccount,
        label: 'Set council vote',
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({
            modal: CouncilVotingModal,
            data: { candidates },
          });
        }
      })
      : buttonStyle
        ? m(Button, {
          disabled: !app.user.activeAccount,
          intent: 'primary',
          label: 'Set council vote',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: CouncilVotingModal,
              data: { candidates },
            });
          },
        })
        : m('a.proposals-action.CollectiveVotingButton', {
          class: !app.user.activeAccount ? 'disabled' : '',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: CouncilVotingModal,
              data: { candidates },
            });
          }
        }, 'Set council vote');
  }
};

export const CandidacyButton: m.Component<{
  candidates: Array<[SubstrateAccount, number]>,
  buttonStyle?: boolean,
  menuStyle?: boolean
}> = {
  view: (vnode) => {
    const { buttonStyle, menuStyle, candidates } = vnode.attrs;

    const activeAccountIsCandidate = app.chain
      && app.user.activeAccount
      && app.user.activeAccount.chainBase === ChainBase.Substrate
      && !!candidates.find(([ who ]) => who.address === app.user.activeAccount.address);

    // TODO: Retract candidacy buttons
    return menuStyle
      ? m(MenuItem, {
        disabled: (!app.user.activeAccount || activeAccountIsCandidate
          || app.chain.networkStatus !== ApiStatus.Connected),
        label: activeAccountIsCandidate ? 'Already a council candidate' : 'Run for council',
        onclick: (e) => {
          e.preventDefault();
          if (app.modals.getList().length > 0) return;
          m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.PhragmenCandidacy });
        },
      })
      : buttonStyle
        ? m(Button, {
          class: '.CandidacyButton',
          disabled: (!app.user.activeAccount || activeAccountIsCandidate
                    || app.chain.networkStatus !== ApiStatus.Connected),
          intent: 'primary',
          label: activeAccountIsCandidate ? 'Already a council candidate' : 'Run for council',
          onclick: (e) => {
            e.preventDefault();
            if (app.modals.getList().length > 0) return;
            m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.PhragmenCandidacy });
          },
        })
        : m('a.proposals-action.CandidacyButton', {
          class: (!app.user.activeAccount || activeAccountIsCandidate || app.chain.networkStatus !== ApiStatus.Connected)
            ? 'disabled' : '',
          onclick: (e) => {
            e.preventDefault();
            if (app.modals.getList().length > 0) return;
            m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.PhragmenCandidacy });
          },
        }, activeAccountIsCandidate ? 'Already a council candidate' : 'Run for council');
  }
};

export const getCouncillors = () => {
  if (app.chain.base !== ChainBase.Substrate) {
    return null;
  }
  const councillors: SubstrateAccount[] = app.chain
    && ((app.chain as Substrate).phragmenElections.members || [])
      .map((a) => app.chain.accounts.get(a))
      .sort((a, b) => {
        const va = (app.chain as Substrate).phragmenElections.backing(a);
        const vb = (app.chain as Substrate).phragmenElections.backing(b);
        if (va === undefined || vb === undefined) return 0;
        return vb.cmp(va);
      });
  return councillors;
};

export const getCouncilCandidates = () => {
  if (app.chain.base !== ChainBase.Substrate) {
    return null;
  }
  const candidates: Array<[SubstrateAccount, number]> = app.chain
    && ((app.chain as Substrate).phragmenElections.activeElection?.candidates || [])
      .map((s): [ SubstrateAccount, number ] => [ app.chain.accounts.get(s), null ])
      .sort((a, b) => {
        const va = (app.chain as Substrate).phragmenElections.backing(a[0]);
        const vb = (app.chain as Substrate).phragmenElections.backing(b[0]);
        if (va === undefined || vb === undefined) return 0;
        return vb.cmp(va);
      });
  return candidates;
};

async function loadCmd() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base !== ChainBase.Substrate) {
    return;
  }
  const chain = (app.chain as Substrate);
  await chain.phragmenElections.init(chain.chain, chain.accounts);
}

const CouncilPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'CouncilPage',
      'Scope': app.activeId(),
    });
  },
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      if (app.chain?.base === ChainBase.Substrate && (app.chain as Substrate).chain?.timedOut) {
        return m(ErrorPage, {
          message: 'Chain connection timed out.',
          title: 'Proposals',
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain (may take up to 10s)...',
        title: 'Council',
        showNewProposalButton: true
      });
    }
    const initialized = app.chain && (app.chain as Substrate).phragmenElections.initialized;
    if (!initialized) {
      if (!(app.chain as Substrate).phragmenElections.initializing) loadCmd();
      return m(PageLoading, {
        message: 'Connecting to chain (may take up to 10s)...',
        title: 'Council',
        showNewProposalButton: true
      });
    }

    const candidates = getCouncilCandidates();
    const councillors = getCouncillors();

    const nSeats = (app.chain as Substrate).phragmenElections.desiredMembers;
    const nRunnersUpSeats = (app.chain as Substrate).phragmenElections.desiredRunnersUp;
    const termDuration = (app.chain as Substrate).phragmenElections.termDuration;
    const votingBond = formatCoin((app.chain as Substrate).phragmenElections.votingBond);
    const nextRoundStartBlock = (app.chain as Substrate).phragmenElections.activeElection.endTime.blocknum;
    const candidacyBond = formatCoin((app.chain as Substrate).phragmenElections.candidacyBond);
    const voters = (app.chain as Substrate).phragmenElections.activeElection.getVoters();
    const electionIndex = (app.chain as Substrate).phragmenElections.round;

    return m(Sublayout, {
      class: 'CouncilPage',
      title: 'Council',
      showNewProposalButton: true,
      showCouncilMenu: true,
    }, [
      // stats
      m(Grid, {
        align: 'middle',
        class: 'stats-container',
        gutter: 5,
        justify: 'space-between'
      }, [
        m(Col, { span: { xs: 6, md: 3 } }, [
          m('.stats-heading', 'Councillors'),
          m('.stats-tile', `${councillors?.length} / ${nSeats}`),
        ]),
        m(Col, { span: { xs: 6, md: 3 } }, [
          m('.stats-heading', 'Runners-up'),
          m('.stats-tile', `${Math.min((candidates?.length - councillors?.length), nRunnersUpSeats)} / ${nRunnersUpSeats}`),
        ]),
        m(Col, { span: { xs: 6, md: 3 } }, [
          m('.stats-heading', 'Next council'),
          m('.stats-tile', m(CountdownUntilBlock, { block: nextRoundStartBlock, includeSeconds: false })),
        ]),
        m(Col, { span: { xs: 6, md: 3 } }, [
          m('.stats-heading', 'Candidacy bond'),
          m('.stats-tile', candidacyBond),
        ]),
      ]),
      m('.button-wrap', {
        style: 'margin: 15px 0 0; text-align: end'
      }, [
        m(CollectiveVotingButton, { buttonStyle: true, candidates }),
        m(CandidacyButton, { buttonStyle: true, candidates }),
      ]),
      // councillors
      m(Listing, {
        content: councillors.length === 0
          ? [ m('.no-proposals', 'None') ]
          : [m('.councillors', [
            councillors.map(
              (account) => m(CouncilRow, { account })
            ),
            m('.clear'),
          ])],
        rightColSpacing: [0],
        columnHeaders: [
          'Councillors',
        ],
      }),
      // candidates
      m(Listing, {
        content: candidates.length === 0
          ? [ m('.no-proposals', 'None') ]
          : [
            candidates.filter(([ account ]) => !councillors.includes(account))
              .map(([account, slot]) => m(CouncilRow, { account })),
            m('.clear'),
          ],
        rightColSpacing: [4, 6],
        columnHeaders: [
          'Runners-up',
        ]
      })
    ]);
  },
};

export default CouncilPage;
