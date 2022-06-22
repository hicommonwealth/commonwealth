import 'pages/council.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';

import app, { ApiStatus } from 'state';
import { navigateToSubpage } from 'app';
import { ProposalType, ChainBase } from 'types';
import { pluralize } from 'helpers';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_election';

import Sublayout from 'views/sublayout';
import User from 'views/components/widgets/user';
import { CountdownUntilBlock } from 'views/components/countdown';
import CouncilVotingModal from 'views/modals/council_voting_modal';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import loadSubstrateModules from 'views/components/load_substrate_modules';

const Councillor: m.Component<{ account }> = {
  view: (vnode) => {
    if (!vnode.attrs.account) return;
    const { account } = vnode.attrs;

    // TODO: refactor this logic to the top level
    const election = (app.chain as Substrate).phragmenElections;
    const votes: PhragmenElectionVote[] = (
      app.chain as Substrate
    ).phragmenElections.activeElection
      ?.getVotes()
      .filter((v) => v.votes.includes(account.address));

    return m('.Councillor', [
      m(User, { user: account, popover: true, hideIdentityIcon: true }),
      m('.councillor-status', [
        election.isMember(account)
          ? `${election.backing(account).format(true)} from ${pluralize(
              votes?.length || 0,
              'voter'
            )}`
          : election.isRunnerUp(account)
          ? `${election.runnerUpBacking(account).format(true)} from ${pluralize(
              votes?.length || 0,
              'voter'
            )}`
          : `??? from ${pluralize(votes?.length || 0, 'voter')}`,
      ]),
    ]);
  },
};

const getCouncillors = () => {
  if (app.chain.base !== ChainBase.Substrate) {
    return null;
  }
  const councillors: SubstrateAccount[] =
    app.chain &&
    ((app.chain as Substrate).phragmenElections.members || [])
      .map((a) => app.chain.accounts.get(a))
      .sort((a, b) => {
        const va = (app.chain as Substrate).phragmenElections.backing(a);
        const vb = (app.chain as Substrate).phragmenElections.backing(b);
        if (va === undefined || vb === undefined) return 0;
        return vb.cmp(va);
      });
  return councillors;
};

const getCouncilCandidates = () => {
  if (app.chain.base !== ChainBase.Substrate) {
    return null;
  }
  const candidates: Array<[SubstrateAccount, number]> =
    app.chain &&
    (
      (app.chain as Substrate).phragmenElections.activeElection?.candidates ||
      []
    )
      .map((s): [SubstrateAccount, number] => [app.chain.accounts.get(s), null])
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
    const chain = app.chain as Substrate;
    return [chain.phragmenElections];
  } else {
    throw new Error('invalid chain');
  }
}

const CouncilPage: m.Component<{}> = {
  oncreate: () => {},
  view: () => {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return m(ErrorPage, {
          message: 'Could not connect to chain',
          title: [
            'Council',
            m(Tag, {
              size: 'xs',
              label: 'Beta',
              style: 'position: relative; top: -2px; margin-left: 6px',
            }),
          ],
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: [
          'Council',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      });
    }

    const modLoading = loadSubstrateModules('Council', getModules);
    if (modLoading) return modLoading;

    const candidates = getCouncilCandidates();
    const councillors = getCouncillors();

    const activeAccountIsCandidate =
      app.chain &&
      app.user.activeAccount &&
      app.user.activeAccount.chainBase === ChainBase.Substrate &&
      !!candidates.find(
        ([who]) => who.address === app.user.activeAccount.address
      );

    const nRunnersUpSeats = (app.chain as Substrate).phragmenElections
      .desiredRunnersUp;
    const nextRoundStartBlock = (app.chain as Substrate).phragmenElections
      .activeElection?.endTime.blocknum;

    return m(
      Sublayout,
      {
        title: [
          'Council',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      },
      m('.CouncilPage', [
        // stats
        m('.stats-box', [
          m('.stats-box-left', '💭'),
          m('.stats-box-right', [
            m('', [
              m('strong', 'Councillors'),
              m('span', [
                ' are elected by coin holders to govern the network. ',
                'The council can approve/reject treasury proposals, propose simple-majority referenda, ',
                'or create fast-track referenda.',
              ]),
            ]),
            m('', [
              m('.stats-box-stat', `Councillors: ${councillors?.length}`),
              m('.stats-box-stat', [
                `Runners-up: ${Math.min(
                  candidates?.length - councillors?.length,
                  nRunnersUpSeats
                )}`,
              ]),
              m('.stats-box-stat', [
                'Next election finishes: ',
                nextRoundStartBlock &&
                  m(CountdownUntilBlock, {
                    block: nextRoundStartBlock,
                    includeSeconds: false,
                  }),
                !nextRoundStartBlock && '--',
              ]),
              app.user.activeAccount &&
                app.chain.networkStatus === ApiStatus.Connected &&
                m('.stats-box-action', [
                  m(
                    'a',
                    {
                      onclick: (e) => {
                        e.preventDefault();
                        app.modals.create({
                          modal: CouncilVotingModal,
                          data: { candidates },
                        });
                      },
                    },
                    'Vote'
                  ),
                ]),
              app.user.activeAccount &&
                app.chain.networkStatus === ApiStatus.Connected &&
                m('.stats-box-action', [
                  m(
                    'a',
                    {
                      onclick: (e) => {
                        e.preventDefault();
                        if (activeAccountIsCandidate) {
                          return;
                        }
                        navigateToSubpage('/new/proposal/:type', {
                          type: ProposalType.PhragmenCandidacy,
                        });
                      },
                    },
                    activeAccountIsCandidate
                      ? 'Already a council candidate'
                      : 'Run for council'
                  ),
                ]),
            ]),
          ]),
        ]),
        // councillors
        m('h3', 'Councillors'),
        councillors.map((account) => m(Councillor, { account })),
        m('.clear'),
        m('h3', 'Runners-up'),
        candidates
          .filter(([account]) => !councillors.includes(account))
          .map(([account]) => m(Councillor, { account })),
        m('.clear'),
      ])
    );
  },
};

export default CouncilPage;
