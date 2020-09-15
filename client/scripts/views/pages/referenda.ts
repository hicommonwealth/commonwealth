import 'pages/proposals.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { formatDuration, blockperiodToDuration } from 'helpers';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase } from 'models';
import Edgeware from 'controllers/chain/edgeware/main';
import {
  convictionToWeight, convictionToLocktime, convictions
} from 'controllers/chain/substrate/democracy_referendum';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ConvictionsTable from 'views/components/proposals/convictions_table';
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import ProposalRow from 'views/components/proposal_row';
import { CountdownUntilBlock } from 'views/components/countdown';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import NewProposalPage from 'views/pages/new_proposal/index';
import { Grid, Col, List } from 'construct-ui';
import moment from 'moment';
import Listing from './listing';

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
          m('.stats-heading', 'Next referendum'),
          (app.chain as Substrate).democracyProposals.nextLaunchBlock
            ? m(CountdownUntilBlock, {
              block: (app.chain as Substrate).democracyProposals.nextLaunchBlock,
              includeSeconds: false
            })
            : '--',
        ]),
      ]),
      m(Col, { span: { xs: 6, md: 3 } }, [
        m('.stats-tile', [
          m('.stats-heading', 'Enactment delay'),
          (app.chain as Substrate).democracy.enactmentPeriod
            ? blockperiodToDuration((app.chain as Substrate).democracy.enactmentPeriod).asDays()
            : '--',
          ' days'
        ]),
      ]),
    ]);
  }
};

const ReferendaPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ReferendaPage' });
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
    if (!app.chain || !app.chain.loaded) return m(PageLoading, { message: 'Connecting to chain (may take up to 30s)...', title: 'Referenda' });
    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;

    // active proposals
    const activeDemocracyReferenda = onSubstrate
      && (app.chain as Substrate).democracy.store.getAll().filter((p) => !p.completed);
    const activeProposalContent = !activeDemocracyReferenda?.length
      ? [ m('.no-proposals', 'None') ]
      : (activeDemocracyReferenda || []).map((proposal) => m(ProposalRow, { proposal }));

    // inactive proposals
    const inactiveDemocracyReferenda = onSubstrate
      && (app.chain as Substrate).democracy.store.getAll().filter((p) => p.completed);
    const inactiveProposalContent = !inactiveDemocracyReferenda?.length
      ? [ m('.no-proposals', 'None') ]
      : (inactiveDemocracyReferenda || []).map((proposal) => m(ProposalRow, { proposal }));

    return m(Sublayout, {
      class: 'ReferendaPage',
      title: 'Referenda',
      showNewProposalButton: true,
    }, [
      onSubstrate && m(SubstrateProposalStats),
      m(Listing, {
        content: activeProposalContent,
        columnHeaders: ['Active Referenda', 'Comments', 'Likes', 'Updated'],
        rightColSpacing: [4, 4, 4]
      }),
      m(Listing, {
        content: inactiveProposalContent,
        columnHeaders: ['Inactive Referenda', 'Comments', 'Likes', 'Updated'],
        rightColSpacing: [4, 4, 4]
      }),
    ]);
  }
};

export default ReferendaPage;
