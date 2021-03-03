import 'pages/proposals.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Grid, Col, List, Tag } from 'construct-ui';
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
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import ProposalRow from 'views/components/proposal_row';
import { CountdownUntilBlock } from 'views/components/countdown';
import NewProposalPage from 'views/pages/new_proposal/index';
import Listing from 'views/pages/listing';
import ErrorPage from 'views/pages/error';

const SubstrateProposalStats: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain) return;

    return m(Grid, {
      align: 'middle',
      class: 'stats-container',
      gutter: 5,
      justify: 'space-between'
    }, [
      m(Col, { span: { xs: 6, md: 3 } }, [
        m('.stats-tile', [
          m('.stats-heading', 'Next treasury spend'),
          (app.chain as Substrate).treasury.nextSpendBlock
            ? m(CountdownUntilBlock, {
              block: (app.chain as Substrate).treasury.nextSpendBlock,
              includeSeconds: false
            })
            : '--',
        ]),
      ]),
      m(Col, { span: { xs: 6, md: 3 } }, [
        // TODO: Pot is under construction
        m('.stats-tile', [
          m('.stats-heading', 'Treasury balance'),
          app.chain && formatCoin((app.chain as Substrate).treasury.pot),
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
      }, 1);
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
    if (onSubstrate) {
      const modules = getModules();
      if (modules.some((mod) => !mod.ready)) {
        app.chain.loadModules(modules);
        return m(PageLoading, {
          message: 'Connecting to chain',
          title: [
            'Treasury',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ],
          showNewProposalButton: true,
        });
      }
    }

    const activeTreasuryProposals = onSubstrate
      && (app.chain as Substrate).treasury.store.getAll().filter((p) => !p.completed);
    const activeTreasuryContent = activeTreasuryProposals.length
      ? activeTreasuryProposals.map((proposal) => m(ProposalRow, { proposal }))
      : [ m('.no-proposals', 'None') ];

    const inactiveTreasuryProposals = onSubstrate
      && (app.chain as Substrate).treasury.store.getAll().filter((p) => p.completed);
    const inactiveTreasuryContent = inactiveTreasuryProposals.length
      ? inactiveTreasuryProposals.map((proposal) => m(ProposalRow, { proposal }))
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
      m(Listing, {
        content: activeTreasuryContent,
        columnHeader: 'Active Treasury Proposals',
      }),
      m(Listing, {
        content: inactiveTreasuryContent,
        columnHeader: 'Inactive Treasury Proposals',
      })
    ]);
  }
};

export default TreasuryPage;
