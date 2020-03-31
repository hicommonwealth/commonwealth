import 'pages/council.scss';

import { default as _ } from 'lodash';
import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';

import app, { ApiStatus } from 'state';
import { ProposalType } from 'identifiers';
import { formatNumberLong, pluralize, link } from 'helpers';
import { formatCoin } from 'adapters/currency';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { ChainBase, ChainClass, IVote } from 'models/models';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_elections';
import ProfileBlock from 'views/components/widgets/profile_block';
import User from 'views/components/widgets/user';
import { CountdownUntilBlock } from 'views/components/countdown';
import NewProposalModal from 'views/modals/proposals';
import { createTXModal } from 'views/modals/tx_signing_modal';
import CouncilVotingModal from 'views/modals/council_voting_modal';
import ListingPage from 'views/pages/_listing_page';
import PageLoading from 'views/pages/loading';

interface ICollectiveMemberAttrs {
  account: SubstrateAccount;
  title: string;
}

const CollectiveMember: m.Component<ICollectiveMemberAttrs> = {
  view: (vnode) => {
    if (!vnode.attrs.account) return;
    const { account, title } = vnode.attrs;
    const expiresOnBlock = (app.chain as Substrate).phragmenElections.activeElection.endTime.blocknum;

    return link('a.CollectiveMember', `/${account.chain.id}/account/${account.address}`, [
      m('.col-member', m(ProfileBlock, { account })),
      m('.col-info', [
        m('.metadata-item', title),
        m('.metadata-item', expiresOnBlock < app.chain.block.height ? [
          `Term ended ${formatNumberLong(expiresOnBlock)} (refresh to update)`
        ] : [
          `Term ends ${formatNumberLong(expiresOnBlock)} (`,
          m(CountdownUntilBlock, { block: expiresOnBlock }),
          ')',
        ]),
      ]),
    ]);
  }
};

const CollectiveVotingButton: m.Component<{ candidates }> = {
  view: (vnode) => {
    const { candidates } = vnode.attrs;
    return m('a.proposals-action.CollectiveVotingButton', {
      class: !app.vm.activeAccount ? 'disabled' : '',
      onclick: (e) => {
        e.preventDefault();
        app.modals.create({
          modal: CouncilVotingModal,
          data: { candidates },
        });
      }
    }, 'Vote');
  }
};

const CandidacyButton: m.Component<{ activeAccountIsCandidate, candidates }> = {
  view: (vnode) => {
    const { activeAccountIsCandidate, candidates } = vnode.attrs;

    // TODO: Retract candidacy buttons
    return m('a.proposals-action.CandidacyButton', {
      class: (!app.vm.activeAccount || activeAccountIsCandidate || app.chain.networkStatus !== ApiStatus.Connected) ?
        'disabled' : '',
      onclick: (e) => {
        e.preventDefault();
        if (app.modals.getList().length > 0) return;
        app.modals.create({ modal: NewProposalModal, data: { typeEnum: ProposalType.PhragmenCandidacy } });
      },
    }, activeAccountIsCandidate ? 'Submitted candidacy' : 'Submit candidacy');
  }
};

// TODO: identify and display whether user has already placed a voter bond
interface ICouncilCandidateAttrs {
  candidate: SubstrateAccount;
}

const CouncilCandidate: m.Component<ICouncilCandidateAttrs> = {
  view: (vnode) => {
    const candidate = vnode.attrs.candidate;
    const votes: Array<IVote<SubstrateCoin>> =
      (app.chain as Substrate).phragmenElections.activeElection.getVotes()
        .filter((v) => v.votes.includes(candidate.address));
    const hasMyVote = app.vm.activeAccount && votes.filter((v) => v.account === app.vm.activeAccount);

    return link('a.CouncilCandidate', `/${candidate.chain.id}/account/${candidate.address})}`, [
      m('.col-member', m(ProfileBlock, { account: candidate })),
      m('.col-info', [
        m('.metadata-item', [
          `${pluralize(votes.length, 'account')} supporting`,
          hasMyVote && ' (✓ Supporting)',
        ]),
      ]),
    ]);
  }
};

interface ICouncilElectionVoterAttrs {
  vote: PhragmenElectionVote;
}

const CouncilElectionVoter: m.Component<ICouncilElectionVoterAttrs> = {
  view: (vnode) => {
    const myAccount = app.vm.activeAccount as SubstrateAccount;
    let voterAccount: SubstrateAccount;
    let canBeReaped: boolean;
    let isPresentationPhase: boolean;
    let lastActive: number;
    let stake: string;
    const voter = vnode.attrs.vote as PhragmenElectionVote;
    voterAccount = voter.account;
    canBeReaped = (app.chain as Substrate).phragmenElections.activeElection.isDefunctVoter(voterAccount);
    isPresentationPhase = false;
    lastActive = null;
    stake = voter.stake.format();
    const canBeRetracted = app.vm.activeAccount && voterAccount.address === myAccount.address;

    return link('a.CouncilElectionVoter', `/${voterAccount.chain.id}/account/${voterAccount.address}`, [
      m('.col-member', m(ProfileBlock, { account: voterAccount })),
      m('.col-info', [
        m('.metadata-item', `Locked ${stake}`),
        (canBeReaped || canBeRetracted) && m('a', {
          href: '#',
          class: (isPresentationPhase || !app.vm.activeAccount) ? 'disabled' : '',
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
          isPresentationPhase ? 'Can only claim in voting phase' :
            canBeRetracted ? 'Retract vote' :
            'Reap vote to claim bond'
        ]),
      ]),
    ]);
  }
};

const CouncilPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'CouncilPage',
      'Scope': app.activeId(),
    });
  },
  view: (vnode) => {
    if (!app.chain) return m(PageLoading);

    const initialized = app.chain && (app.chain as Substrate).phragmenElections.initialized;

    if (!initialized) return m(PageLoading);

    const councillors: SubstrateAccount[] = app.chain
      && ((app.chain as Substrate).phragmenElections.members || []).map((a) => app.chain.accounts.get(a));
    const candidates: Array<[SubstrateAccount, number]> = app.chain &&
     ((app.chain as Substrate).phragmenElections.activeElection &&
       (app.chain as Substrate).phragmenElections.activeElection.candidates || [])
       .map((s): [ SubstrateAccount, number ] => [ app.chain.accounts.get(s), null ]);

    const nSeats = app.chain && (app.chain as Substrate).phragmenElections.desiredMembers;
    const termDuration = app.chain && (app.chain as Substrate).phragmenElections.termDuration;
    const votingBond = app.chain && formatCoin((app.chain as Substrate).phragmenElections.votingBond);
    const nextRoundStartBlock = app.chain && (app.chain as Substrate).phragmenElections.activeElection.endTime.blocknum;
    const candidacyBond = app.chain && formatCoin((app.chain as Substrate).phragmenElections.candidacyBond);
    const voters = app.chain && (app.chain as Substrate).phragmenElections.activeElection.getVoters();
    const electionIndex = app.chain && (app.chain as Substrate).phragmenElections.round;
    const activeAccountIsCandidate = app.chain && app.vm.activeAccount &&
      app.vm.activeAccount.chainBase === ChainBase.Substrate &&
        !!candidates.find(([ who ]) => who.address === app.vm.activeAccount.address);

    return m(ListingPage, {
      class: 'CouncilPage',
      title: 'Council',
      subtitle: 'Elect accounts with governance responsibilities',
      content: [
        // councillors
        m('h4.proposals-subheader', 'Councillors'),
        councillors.length === 0
          ? m('.no-proposals', 'No members')
          : m('.councillors', [
            councillors.map(
              (account) => m(CollectiveMember, { account, title: 'Councillor' })
            ),
            m('.clear'),
          ]),
        // candidates
        m('h4.proposals-subheader', [
          'Candidates',
          m(CollectiveVotingButton, { candidates }),
          m(CandidacyButton, { activeAccountIsCandidate, candidates }),
        ]),
        candidates.length === 0
          ? m('.no-proposals', 'No candidates')
          : m('.council-candidates', [
            candidates.map(([candidate, slot]) => m(CouncilCandidate, { candidate })),
            m('.clear'),
          ]),
        // voters
        app.chain && app.chain.class !== ChainClass.Kusama && [
          m('h4.proposals-subheader', 'Voters'),
          m('.council-election-voters', app.chain && [
            voters.length === 0
              ? m('.no-proposals', 'No voters')
              : m('.council-voters', [
                voters.map((acct) => m(CouncilElectionVoter, {
                  vote: (app.chain as Substrate).phragmenElections.activeElection.getVotes(
                    app.chain.accounts.get(acct)
                  )[0]
                })),
                m('.clear'),
              ]),
          ]),
        ],
      ],
      sidebar: [
        // stats
        m('.forum-container.stats-tile', [
          m('.stats-tile-label', 'Candidacy Bond'),
          m('.stats-tile-figure-major', app.chain &&
            `${candidacyBond || '--'}`),
        ]),
        m('.forum-container.stats-tile', [
          m('.stats-tile-label', 'Voting Bond'),
          m('.stats-tile-figure-major', app.chain &&
            `${votingBond || '--'}`),
        ]),
        m('.forum-container.stats-tile', [
          m('.stats-tile-label', 'Councillors'),
          m('.stats-tile-figure-major', app.chain && councillors.length || '--'),
          m('.stats-tile-figure-minor', app.chain &&
            `Target council size: ${nSeats || '--'}`),
        ]),
        m('.forum-container.stats-tile', !app.chain ? [
          m('.stats-tile-label', 'Current Election'),
          m('.stats-tile-figure-major', '--'),
        ] : [
          m('.stats-tile-label', 'Current Election'),
          m('.stats-tile-figure-major', 'Voting open'),
          m('.stats-tile-figure-minor', pluralize(candidates.length, 'candidate')),
        ]),
        m('.forum-container.stats-tile', !app.chain ? [
          m('.stats-tile-label', 'Voting Ends'),
          m('.stats-tile-figure-major', '--'),
        ] : [
          m('.stats-tile-label', 'Voting Ends'),
          m('.stats-tile-figure-major',
            m(CountdownUntilBlock, { block: nextRoundStartBlock })),
          m('.stats-tile-figure-minor', 'Block ' + nextRoundStartBlock),
        ]),
      ],
    });
  },
};

export default CouncilPage;
