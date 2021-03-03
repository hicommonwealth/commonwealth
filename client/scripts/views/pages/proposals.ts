import 'pages/proposals.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Grid, Col, List, Tag } from 'construct-ui';
import moment from 'moment';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { formatDuration, blockperiodToDuration } from 'helpers';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase, ChainNetwork } from 'models';

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

async function loadCmd() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = (app.chain as Substrate);
    await Promise.all([
      chain.council.init(chain.chain, chain.accounts),
      chain.technicalCommittee.init(chain.chain, chain.accounts),
      chain.treasury.init(chain.chain, chain.accounts),
      chain.democracyProposals.init(chain.chain, chain.accounts),
      chain.democracy.init(chain.chain, chain.accounts),
    ]);
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    const chain = (app.chain as Cosmos);
    await Promise.all([
      chain.governance.init(chain.chain, chain.accounts),
    ]);
  }
}

const ProposalsPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ProposalsPage' });
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
            'Proposals',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ],
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: [
          'Proposals',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
        showNewProposalButton: true,
      });
    }
    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;
    const onMoloch = app.chain && app.chain.class === ChainClass.Moloch;

    if (onSubstrate) {
      // Democracy, Council must be loaded to proceed
      const chain = app.chain as Substrate;
      if (!chain.democracy.initialized || !chain.council.initialized || !chain.democracyProposals.initialized) {
        if (!chain.democracy.initializing && !chain.council.initializing) loadCmd();
        return m(PageLoading, {
          message: 'Connecting to chain',
          title: [
            'Proposals',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ],
          showNewProposalButton: true,
        });
      }
    }
    // active proposals
    const activeDemocracyProposals = onSubstrate
      && (app.chain as Substrate).democracyProposals.store.getAll().filter((p) => !p.completed);
    const activeCouncilProposals = onSubstrate
      && (app.chain as Substrate).council.store.getAll().filter((p) => !p.completed);
    const activeCosmosProposals = (app.chain && app.chain.base === ChainBase.CosmosSDK)
      && (app.chain as Cosmos).governance.store.getAll()
        .filter((p) => !p.completed).sort((a, b) => +b.identifier - +a.identifier);
    const activeMolochProposals = onMoloch
      && (app.chain as Moloch).governance.store.getAll().filter((p) => !p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);

    const activeProposalContent = !activeDemocracyProposals?.length
      && !activeCouncilProposals?.length
      && !activeCosmosProposals?.length
      && !activeMolochProposals?.length
      ? [ m('.no-proposals', 'None') ]
      : (activeDemocracyProposals || []).map((proposal) => m(ProposalRow, { proposal }))
        .concat((activeCouncilProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((activeCosmosProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((activeMolochProposals || []).map((proposal) => m(ProposalRow, { proposal })));

    // inactive proposals
    const inactiveDemocracyProposals = onSubstrate
      && (app.chain as Substrate).democracyProposals.store.getAll().filter((p) => p.completed);
    const inactiveCouncilProposals = onSubstrate
      && (app.chain as Substrate).council.store.getAll().filter((p) => p.completed);
    const inactiveCosmosProposals = (app.chain && app.chain.base === ChainBase.CosmosSDK)
      && (app.chain as Cosmos).governance.store.getAll()
        .filter((p) => p.completed).sort((a, b) => +b.identifier - +a.identifier);
    const inactiveMolochProposals = onMoloch
      && (app.chain as Moloch).governance.store.getAll().filter((p) => p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);

    const inactiveProposalContent = !inactiveDemocracyProposals?.length
      && !inactiveCouncilProposals?.length
      && !inactiveCosmosProposals?.length
      && !inactiveMolochProposals?.length
      ? [ m('.no-proposals', 'None') ]
      : (inactiveDemocracyProposals || []).map((proposal) => m(ProposalRow, { proposal }))
        .concat((inactiveCouncilProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((inactiveCosmosProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((inactiveMolochProposals || []).map((proposal) => m(ProposalRow, { proposal })));

    // XXX: display these
    const visibleTechnicalCommitteeProposals = app.chain
      && (app.chain.class === ChainClass.Kusama || app.chain.class === ChainClass.Polkadot)
      && (app.chain as Substrate).technicalCommittee.store.getAll();

    return m(Sublayout, {
      class: 'ProposalsPage',
      title: [
        'Proposals',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      onSubstrate && m(SubstrateProposalStats),
      m(Listing, { content: activeProposalContent }),
      m(Listing, { content: inactiveProposalContent }),
    ]);
  }
};

export default ProposalsPage;
