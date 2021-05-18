import 'pages/treasury.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Button, Grid, Col, List, Tag } from 'construct-ui';
import moment from 'moment';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { formatDuration, blockperiodToDuration } from 'helpers';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase } from 'models';

import Edgeware from 'controllers/chain/edgeware/main';
import {
  convictionToWeight, convictionToLocktime, convictions
} from 'controllers/chain/substrate/democracy_referendum';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import LoadingRow from 'views/components/loading_row';
import ProposalCard from 'views/components/proposal_card';
import { CountdownUntilBlock } from 'views/components/countdown';
import NewProposalPage from 'views/pages/new_proposal/index';
import Listing from 'views/pages/listing';
import ErrorPage from 'views/pages/error';
import loadSubstrateModules from 'views/components/load_substrate_modules';

const SubstrateProposalStats: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain) return;
    const activeAccount = app.user.activeAccount;

    return m('.stats-box', [
      m('.stats-box-left', '💭'),
      m('.stats-box-right', [
        m('', [
          m('strong', 'Treasury Proposals'),
          m('span', [
            ' are used to request funds from the on-chain treasury. They are approved/rejected by referendum or council.',
          ]),
          m('', [
            m('.stats-box-stat', [
              'Treasury: ', formatCoin((app.chain as Substrate).treasury.pot),
            ]),
            m('.stats-box-stat', [
              'Next treasury spend: ',
              (app.chain as Substrate).treasury.nextSpendBlock
                ? m(CountdownUntilBlock, {
                  block: (app.chain as Substrate).treasury.nextSpendBlock,
                  includeSeconds: false
                })
                : '--',
            ]),
          ]),
          app.chain?.class !== ChainClass.Plasm && m('', [
            m(Button, {
              class: activeAccount ? '' : 'disabled',
              onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
                type: ProposalType.SubstrateTreasuryProposal
              }),
              rounded: true,
              label: 'New treasury proposal',
            }),
          ]),
        ]),
      ]),
    ]);
    // onMoloch && m('.stats-tile', [
    //   m('.stats-tile-label', 'DAO Basics'),
    //   m('.stats-tile-figure-minor', [
    //     `Voting Period Length: ${onMoloch && (app.chain as Moloch).governance.votingPeriodLength}`
    //   ]),
    //   m('.stats-tile-figure-minor', [
    //     `Total Shares: ${onMoloch && (app.chain as Moloch).governance.totalShares}`
    //   ]),
    //   m('.stats-tile-figure-minor', [
    //     `Summoned At: ${onMoloch && (app.chain as Moloch).governance.summoningTime}`
    //   ]),
    //   m('.stats-tile-figure-minor', [
    //     `Proposal Count: ${onMoloch && (app.chain as Moloch).governance.proposalCount}`
    //   ]),
    //   m('.stats-tile-figure-minor', [
    //     `Proposal Deposit: ${onMoloch && (app.chain as Moloch).governance.proposalDeposit}`
    //   ]),
    // ]),
  }
};

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = (app.chain as Substrate);
    return [ chain.council, chain.treasury, chain.democracyProposals, chain.democracy ];
  } else {
    throw new Error('invalid chain');
  }
}

const TreasuryPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'TreasuryPage' });
    let returningFromThread = false;
    Object.values(ProposalType).forEach((type) => {
      if (app.lastNavigatedBack() && app.lastNavigatedFrom().includes(`/proposal/${type}/`)) {
        returningFromThread = true;
      }
    });
    if (returningFromThread && localStorage[`${app.activeId()}-proposals-scrollY`]) {
      setTimeout(() => {
        window.scrollTo(0, Number(localStorage[`${app.activeId()}-proposals-scrollY`]));
      }, 100);
    }
  },
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      if (app.chain?.base === ChainBase.Substrate && (app.chain as Substrate).chain?.timedOut) {
        return m(ErrorPage, {
          message: 'Could not connect to chain',
          title: [
            'Treasury',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ]
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: [
          'Treasury',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
        showNewProposalButton: true,
      });
    }
    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;

    const modLoading = loadSubstrateModules('Treasury', getModules);
    if (modLoading) return modLoading;

    const activeTreasuryProposals = onSubstrate
      && (app.chain as Substrate).treasury.store.getAll().filter((p) => !p.completed);
    const activeTreasuryContent = activeTreasuryProposals.length
      ? activeTreasuryProposals.map((proposal) => m(ProposalCard, { proposal }))
      : [ m('.no-proposals', 'None') ];

    const inactiveTreasuryProposals = onSubstrate
      && (app.chain as Substrate).treasury.store.getAll().filter((p) => p.completed);
    const inactiveTreasuryContent = inactiveTreasuryProposals.length
      ? inactiveTreasuryProposals.map((proposal) => m(ProposalCard, { proposal }))
      : [ m('.no-proposals', 'None') ];

    return m(Sublayout, {
      class: 'TreasuryPage',
      title: [
        'Treasury',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      onSubstrate && m(SubstrateProposalStats),
      m('.clear'),
      m(Listing, {
        content: activeTreasuryContent,
        columnHeader: 'Active Treasury Proposals',
      }),
      m('.clear'),
      m(Listing, {
        content: inactiveTreasuryContent,
        columnHeader: 'Inactive Treasury Proposals',
      }),
      m('.clear'),
    ]);
  }
};

export default TreasuryPage;
