import 'pages/council.scss';

import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Grid, Col, Button, MenuItem, Tag } from 'construct-ui';

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
import Listing from 'views/pages/listing';
import ErrorPage from 'views/pages/error';

const Councillor: m.Component<{ account }> = {
  view: (vnode) => {
    if (!vnode.attrs.account) return;
    const { account } = vnode.attrs;

    // TODO: refactor this logic to the top level
    const election = (app.chain as Substrate).phragmenElections;
    const votes: PhragmenElectionVote[] = (app.chain as Substrate).phragmenElections.activeElection.getVotes()
      .filter((v) => v.votes.includes(account.address));
    const hasMyVote = app.user.activeAccount && votes.filter((v) => v.account === app.user.activeAccount);

    return m('.Councillor', [
      m(User, { user: account, popover: true, hideIdentityIcon: true }),
      m('.councillor-status', [
        election.isMember(account)
          ? `${election.backing(account).format(true)} from ${pluralize(votes.length, 'voter')}`
          : `??? from ${pluralize(votes.length, 'voter')}`
      ]),
    ]);
  }
};

const CouncilElectionVoter: m.Component<{
  vote: PhragmenElectionVote;
}> = {
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
          rounded: true,
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
          rounded: true,
          label: activeAccountIsCandidate ? 'Already a council candidate' : 'Run for council',
          onclick: (e) => {
            e.preventDefault();
            if (app.modals.getList().length > 0) return;
            m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.PhragmenCandidacy });
          },
        })
        : m('a.proposals-action.CandidacyButton', {
          class: (!app.user.activeAccount || activeAccountIsCandidate
                  || app.chain.networkStatus !== ApiStatus.Connected) ? 'disabled' : '',
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

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = (app.chain as Substrate);
    return [ chain.phragmenElections ];
  } else {
    throw new Error('invalid chain');
  }
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
          message: 'Could not connect to chain',
          title: [
            'Council',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ],
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: [
          'Council',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
        showNewProposalButton: true
      });
    }

    const modules = getModules();
    if (modules.some((mod) => !mod.ready)) {
      app.chain.loadModules(modules);
      return m(PageLoading, {
        message: 'Loading council',
        title: [
          'Council',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
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
      title: [
        'Council',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
      showCouncilMenu: true,
    }, [
      // stats
      m('.stats-box', [
        m('.stats-box-left', '💭'),
        m('.stats-box-right', [
          m('', [
            m('strong', 'Councillors'),
            m('span', [
              ' are elected by coin holders to govern the network. ',
              'The council can approve/reject treasury proposals, propose simple-majority referenda, ',
              'or create fast-track referenda.'
            ]),
          ]),
          m('', [
            m('.stats-box-stat', `Councillors: ${councillors?.length}`),
            m('.stats-box-stat', [
              `Runners-up: ${Math.min((candidates?.length - councillors?.length), nRunnersUpSeats)} (max ${nRunnersUpSeats})`
            ]),
            m('.stats-box-stat', [
              'Next election finishes: ',
              m(CountdownUntilBlock, { block: nextRoundStartBlock, includeSeconds: false }),
            ]),
            m('.clear'),
            m('.stats-box-action', [
              m(CollectiveVotingButton, { buttonStyle: true, candidates }),
            ]),
            m('.stats-box-action', [
              m(CandidacyButton, { buttonStyle: true, candidates }),
            ]),
          ]),
        ]),
      ]),
      // councillors
      m('h3', 'Councillors'),
      councillors.map(
        (account) => m(Councillor, { account })
      ),
      m('.clear'),
      m('h3', 'Runners-up'),
      candidates.filter(([ account ]) => !councillors.includes(account))
        .map(([account, slot]) => m(Councillor, { account })),
      m('.clear'),
    ]);
  },
};

export default CouncilPage;
