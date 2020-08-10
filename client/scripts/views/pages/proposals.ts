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

const ProposalRowHeader: m.Component<{ title: string }> = {
  view: (vnode) => {
    const { title } = vnode.attrs;
    return m('.ProposalRowHeader', [
      m('.proposal-row-header-col.proposal-row-header-title', title),
      m('.proposal-row-header-col.proposal-row-header-replies', 'Replies'),
      m('.proposal-row-header-col', 'Likes'),
      m('.proposal-row-header-col', 'Activity'),
      app.isLoggedIn() && m('.proposal-row-header-col.proposal-row-menu'),
    ]);
  }
};

const ProposalsPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ProposalsPage' });
  },
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) return m(PageLoading, { message: 'Connecting to chain...', title: 'Proposals' });
    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;
    const onMoloch = app.chain && app.chain.class === ChainClass.Moloch;

    // active proposals
    const activeDemocracyReferenda = onSubstrate
      && (app.chain as Substrate).democracy.store.getAll().filter((p) => !p.completed);
    const activeDemocracyProposals = onSubstrate
      && (app.chain as Substrate).democracyProposals.store.getAll().filter((p) => !p.completed);
    const activeCouncilProposals = onSubstrate
      && (app.chain as Substrate).council.store.getAll().filter((p) => !p.completed);
    const activeSignalingProposals = (app.chain && app.chain.class === ChainClass.Edgeware)
      && (app.chain as Edgeware).signaling.store.getAll()
        .filter((p) => !p.completed).sort((p1, p2) => p1.getVotes().length - p2.getVotes().length);
    const activeTreasuryProposals = onSubstrate
      && (app.chain as Substrate).treasury.store.getAll().filter((p) => !p.completed);
    const activeCosmosProposals = (app.chain && app.chain.base === ChainBase.CosmosSDK)
      && (app.chain as Cosmos).governance.store.getAll()
        .filter((p) => !p.completed).sort((a, b) => +b.identifier - +a.identifier);
    const activeMolochProposals = onMoloch
      && (app.chain as Moloch).governance.store.getAll().filter((p) => !p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);

    // inactive proposals
    const inactiveDemocracyReferenda = onSubstrate
      && (app.chain as Substrate).democracy.store.getAll().filter((p) => p.completed);
    const inactiveDemocracyProposals = onSubstrate
      && (app.chain as Substrate).democracyProposals.store.getAll().filter((p) => p.completed);
    const inactiveCouncilProposals = onSubstrate
      && (app.chain as Substrate).council.store.getAll().filter((p) => p.completed);
    const inactiveSignalingProposals = (app.chain && app.chain.class === ChainClass.Edgeware)
      && (app.chain as Edgeware).signaling.store.getAll()
        .filter((p) => p.completed).sort((p1, p2) => p1.getVotes().length - p2.getVotes().length);
    const inactiveTreasuryProposals = onSubstrate
      && (app.chain as Substrate).treasury.store.getAll().filter((p) => p.completed);
    const inactiveCosmosProposals = (app.chain && app.chain.base === ChainBase.CosmosSDK)
      && (app.chain as Cosmos).governance.store.getAll()
        .filter((p) => p.completed).sort((a, b) => +b.identifier - +a.identifier);
    const inactiveMolochProposals = onMoloch
      && (app.chain as Moloch).governance.store.getAll().filter((p) => p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);

    // XXX: display these
    const visibleTechnicalCommitteeProposals = app.chain
      && (app.chain.class === ChainClass.Kusama || app.chain.class === ChainClass.Polkadot)
      && (app.chain as Substrate).technicalCommittee.store.getAll();

    // let nextReferendum;
    // let nextReferendumDetail;
    // if (!onSubstrate) {
    //   // do nothing
    // } else if ((app.chain as Substrate).democracyProposals.lastTabledWasExternal) {
    //   if (visibleDemocracyProposals)
    //     [nextReferendum, nextReferendumDetail] = ['Democracy', ''];
    //   else
    //     [nextReferendum, nextReferendumDetail] = ['Council',
    //       'Last was council, but no democracy proposal was found'];
    // } else if ((app.chain as Substrate).democracyProposals.nextExternal)
    //   [nextReferendum, nextReferendumDetail] = ['Council', ''];
    // else
    //   [nextReferendum, nextReferendumDetail] = ['Democracy',
    //     'Last was democracy, but no council proposal was found'];

    const maxConvictionWeight = Math.max.apply(this, convictions().map((c) => convictionToWeight(c)));
    const maxConvictionLocktime = Math.max.apply(this, convictions().map((c) => convictionToLocktime(c)));

    return m(Sublayout, {
      class: 'ProposalsPage',
      title: 'Proposals',
      showNewButton: true,
    }, [
      m(Grid, {
        align: 'middle',
        class: 'stats-container',
        gutter: 5,
        justify: 'space-between'
      }, [
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
        m(Col, { span: 4 }, [
          onSubstrate && m('.stats-tile', [
            onSubstrate && (app.chain as Substrate).democracyProposals.nextLaunchBlock
              ? m(CountdownUntilBlock, { block: (app.chain as Substrate).democracyProposals.nextLaunchBlock, includeSeconds: false })
              : '--',
            ' till next referendum',
          ]),
          onSubstrate && m('.stats-tile', [
            app.chain && (app.chain as Substrate).treasury.nextSpendBlock
              ? m(CountdownUntilBlock, { block: (app.chain as Substrate).treasury.nextSpendBlock, includeSeconds: false })
              : '--',
            ' till next treasury spend',
          ]),
        ]),
        m(Col, { span: 4 }, [
          onSubstrate && m('.stats-tile', [
            app.chain
            && (app.chain as Substrate).treasury.bondMinimum
              ? (app.chain as Substrate).treasury.bondMinimum.format()
              : '--',
            ' proposal bond'
          ]),
          onSubstrate && m('.stats-tile', [
            app.chain
            && (app.chain as Substrate).democracyProposals.minimumDeposit
            && (app.chain as Substrate).treasury.computeBond
              ? (app.chain as Substrate).treasury.computeBond(
                (app.chain as Substrate).democracyProposals.minimumDeposit
              ).format()
              : '--',
            ' treasury proposal bond'
          ])
        ]),
        m(Col, { span: 4 }, [
          onSubstrate && m('.stats-tile', [
            app.chain
            && (app.chain as Substrate).democracy.enactmentPeriod
              ? blockperiodToDuration((app.chain as Substrate).democracy.enactmentPeriod).asDays()
              : '--',
            'd enactment delay after approval'
          ]),
          // TODO: Pot is under construction
          onSubstrate && m('.stats-tile', [
            app.chain && formatCoin((app.chain as Substrate).treasury.pot),
            ' in the treasury',
          ]),
        ]),
      ]),
      m(Listing, {
        content: !activeDemocracyReferenda
          && !activeDemocracyProposals
          && !activeCouncilProposals
          && !activeSignalingProposals
          && !activeCosmosProposals
          && !activeMolochProposals
          ? [ m('.no-proposals', 'None') ]
          : activeDemocracyReferenda
            .concat(activeDemocracyProposals as any)
            .concat(activeCouncilProposals as any)
            .concat(activeSignalingProposals as any)
            .concat(activeCosmosProposals as any)
            .map((proposal) => m(ProposalRow, { proposal })),
        header: 'Active Proposals'
      }),
      m(ProposalRowHeader, { title: 'Active Treasury Proposals' }),
      !!activeTreasuryProposals.length
      && activeTreasuryProposals.map((proposal) => m(ProposalRow, { proposal })),
      !activeTreasuryProposals
      && m('.no-proposals', 'None'),
      m(ProposalRowHeader, { title: 'Inactive Proposals' }),
      m(List, { class: 'inactive-proposals' }, [
        !!inactiveDemocracyReferenda.length
        && inactiveDemocracyReferenda.map((proposal) => m(ProposalRow, { proposal })),
        !!inactiveDemocracyProposals.length
        && inactiveDemocracyProposals.map((proposal) => m(ProposalRow, { proposal })),
        !!inactiveCouncilProposals.length
        && inactiveCouncilProposals.map((proposal) => m(ProposalRow, { proposal })),
        !!inactiveSignalingProposals.length
        && inactiveSignalingProposals.map((proposal) => m(ProposalRow, { proposal })),
        !!inactiveCosmosProposals.length
        && inactiveCosmosProposals.map((proposal) => m(ProposalRow, { proposal })),
        !inactiveDemocracyReferenda
        && !inactiveDemocracyProposals
        && !inactiveCouncilProposals
        && !inactiveSignalingProposals
        && !inactiveCosmosProposals
        && !inactiveMolochProposals
        && m('.no-proposals', 'None'),
      ]),
      m(ProposalRowHeader, { title: 'Inactive Treasury Proposals' }),
      !!inactiveTreasuryProposals.length
      && inactiveTreasuryProposals.map((proposal) => m(ProposalRow, { proposal })),
      !inactiveTreasuryProposals
      && m('.no-proposals', 'None'),

    ]);
  }
};

export default ProposalsPage;
