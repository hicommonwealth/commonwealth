import 'pages/council.scss';

import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Tag } from 'construct-ui';

import app, { ApiStatus } from 'state';
import { ProposalType } from 'identifiers';
import { pluralize, link } from 'helpers';
import { formatCoin } from 'adapters/currency';
import { ChainBase } from 'models';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_election';

import Sublayout from 'views/sublayout';
import User, { UserBlock } from 'views/components/widgets/user';
import { CountdownUntilBlock } from 'views/components/countdown';
import { createTXModal } from 'views/modals/tx_signing_modal';
import CouncilVotingModal from 'views/modals/council_voting_modal';
import PageLoading from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import loadSubstrateModules from 'views/components/load_substrate_modules';

const Councillor: m.Component<{ account }> = {
  view: (vnode) => {
    if (!vnode.attrs.account) return;
    const { account } = vnode.attrs;

    // TODO: refactor this logic to the top level
    const election = (app.chain as Substrate).phragmenElections;
    const votes: PhragmenElectionVote[] = (app.chain as Substrate).phragmenElections.activeElection?.getVotes()
      .filter((v) => v.votes.includes(account.address));
    const hasMyVote = app.user.activeAccount && votes.filter((v) => v.account === app.user.activeAccount);

    return m('.Councillor', [
      m(User, { user: account, popover: true, hideIdentityIcon: true }),
      m('.councillor-status', [
        election.isMember(account)
          ? `${election.backing(account).format(true)} from ${pluralize(votes?.length || 0, 'voter')}`
          : election.isRunnerUp(account)
            ? `${election.runnerUpBacking(account).format(true)} from ${pluralize(votes?.length || 0, 'voter')}`
            : `??? from ${pluralize(votes?.length || 0, 'voter')}`
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

    const modLoading = loadSubstrateModules('Council', getModules);
    if (modLoading) return modLoading;

    const candidates = getCouncilCandidates();
    const councillors = getCouncillors();

    const activeAccountIsCandidate = app.chain
      && app.user.activeAccount
      && app.user.activeAccount.chainBase === ChainBase.Substrate
      && !!candidates.find(([ who ]) => who.address === app.user.activeAccount.address);

    const nSeats = (app.chain as Substrate).phragmenElections.desiredMembers;
    const nRunnersUpSeats = (app.chain as Substrate).phragmenElections.desiredRunnersUp;
    const termDuration = (app.chain as Substrate).phragmenElections.termDuration;
    const votingBond = formatCoin((app.chain as Substrate).phragmenElections.votingBond);
    const nextRoundStartBlock = (app.chain as Substrate).phragmenElections.activeElection?.endTime.blocknum;
    const candidacyBond = formatCoin((app.chain as Substrate).phragmenElections.candidacyBond);
    const voters = (app.chain as Substrate).phragmenElections.activeElection?.getVoters();
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
              `Runners-up: ${Math.min((candidates?.length - councillors?.length), nRunnersUpSeats)}`
            ]),
            m('.stats-box-stat', [
              'Next election finishes: ',
              nextRoundStartBlock && m(CountdownUntilBlock, { block: nextRoundStartBlock, includeSeconds: false }),
              !nextRoundStartBlock && '--'
            ]),
            app.user.activeAccount && app.chain.networkStatus === ApiStatus.Connected && m('.stats-box-action', [
              m('a', {
                onclick: (e) => {
                  e.preventDefault();
                  app.modals.create({
                    modal: CouncilVotingModal,
                    data: { candidates },
                  });
                }
              }, 'Vote'),
            ]),
            app.user.activeAccount && app.chain.networkStatus === ApiStatus.Connected && m('.stats-box-action', [
              m('a', {
                onclick: (e) => {
                  e.preventDefault();
                  if (activeAccountIsCandidate) {
                    return;
                  }
                  m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.PhragmenCandidacy });
                },
              }, activeAccountIsCandidate ? 'Already a council candidate' : 'Run for council'),
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
