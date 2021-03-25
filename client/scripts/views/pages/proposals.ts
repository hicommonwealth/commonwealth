import 'pages/proposals.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Grid, Col, List, Tag } from 'construct-ui';
import moment from 'moment';
import BN from 'bn.js';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { formatDuration, blockperiodToDuration } from 'helpers';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase, ChainNetwork, ProposalModule } from 'models';

import Edgeware from 'controllers/chain/edgeware/main';
import {
  convictionToWeight, convictionToLocktime, convictions
} from 'controllers/chain/substrate/democracy_referendum';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import Marlin from 'controllers/chain/ethereum/marlin/adapter';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import LoadingRow from 'views/components/loading_row';
import ProposalRow from 'views/components/proposal_row';
import { CountdownUntilBlock } from 'views/components/countdown';

import NewProposalPage from 'views/pages/new_proposal/index';
import PageNotFound from 'views/pages/404';
import Listing from 'views/pages/listing';
import ErrorPage from 'views/pages/error';

const SubstrateProposalStats: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain) return;

    return m('.stats-box', [
      m('.stats-box-left', '💭'),
      m('.stats-box-right', [
        m('', [
          m('strong', 'Democracy Proposals'),
          m('span', [
            ' can be introduced by anyone. ',
            'At a regular interval, the top ranked proposal will become a supermajority-required referendum.',
          ]),
          m('p', [
            m('strong', 'Council Motions'),
            m('span', [
              ' can be introduced by councillors. They can directly approve/reject treasury proposals, ',
              'propose simple-majority referenda, or create fast-track referenda.',
            ]),
          ]),
        ]),
        m('', [
          m('.stats-box-stat', [
            'Next proposal or motion becomes a referendum: ',
            (app.chain as Substrate).democracyProposals.nextLaunchBlock
              ? m(CountdownUntilBlock, {
                block: (app.chain as Substrate).democracyProposals.nextLaunchBlock,
                includeSeconds: false
              })
              : '--',
          ]),
        ]),
      ]),
    ]);
  }
};

const MarlinProposalStats: m.Component<{}, {}> = {
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
          m('.stats-heading', 'Marlin Basics'),
          m('.stats-tile-figure-major', [
            `Quorum Votes: ${(app.chain as Marlin).governance?.quorumVotes.div(new BN('1000000000000000000')).toString()} MPOND`
          ]),
          m('.stats-tile-figure-minor', [
            `Proposal Threshold: ${(app.chain as Marlin).governance?.proposalThreshold.div(new BN('1000000000000000000')).toString()} MPOND`
          ]),
          m('.stats-tile-figure-minor', [
            `Voting Period Length: ${(app.chain as Marlin).governance.votingPeriod.toString(10)}`,
          ]),
        ]),
      ]),
    ]);
  }
};

function getModules(): ProposalModule<any, any, any>[] {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = (app.chain as Substrate);
    return [
      chain.council,
      chain.technicalCommittee,
      chain.treasury,
      chain.democracyProposals,
      chain.democracy
    ];
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    const chain = (app.chain as Cosmos);
    return [ chain.governance ];
  } else {
    throw new Error('invalid chain');
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
      if (app.chain?.failed) return m(PageNotFound, {
        title: 'Wrong Ethereum Provider Network!',
        message: 'Change Metamask to point to Ethereum Mainnet',
      });
      return m(PageLoading, {
        message: 'Loading proposals',
        title: [
          'Proposals',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
        showNewProposalButton: true,
      });
    }

    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;
    const onMoloch = app.chain && app.chain.class === ChainClass.Moloch;
    const onMarlin = app.chain && (app.chain.network === ChainNetwork.Marlin || app.chain.network === ChainNetwork.MarlinTestnet);

    if (onSubstrate) {
      const modules = getModules();
      if (modules.some((mod) => !mod.ready)) {
        app.chain.loadModules(modules);
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
    const activeMarlinProposals = onMarlin
      && (app.chain as Marlin).governance.store.getAll().filter((p) => !p.completed)
        .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);

    const activeProposalContent = !activeDemocracyProposals?.length
      && !activeCouncilProposals?.length
      && !activeCosmosProposals?.length
      && !activeMolochProposals?.length
      && !activeMarlinProposals?.length
      ? [ m('.no-proposals', 'No active proposals') ]
      : (activeDemocracyProposals || []).map((proposal) => m(ProposalRow, { proposal }))
        .concat((activeCouncilProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((activeCosmosProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((activeMolochProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((activeMarlinProposals || []).map((proposal) => m(ProposalRow, { proposal })));

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
    const inactiveMarlinProposals = onMarlin
      && (app.chain as Marlin).governance.store.getAll().filter((p) => p.completed)
        .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);

    const inactiveProposalContent = !inactiveDemocracyProposals?.length
      && !inactiveCouncilProposals?.length
      && !inactiveCosmosProposals?.length
      && !inactiveMolochProposals?.length
      && !inactiveMarlinProposals?.length
      ? [ m('.no-proposals', 'No past proposals') ]
      : (inactiveDemocracyProposals || []).map((proposal) => m(ProposalRow, { proposal }))
        .concat((inactiveCouncilProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((inactiveCosmosProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((inactiveMolochProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((inactiveMarlinProposals || []).map((proposal) => m(ProposalRow, { proposal })));


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
      onMarlin && m(MarlinProposalStats),
      m('.clear'),
      m(Listing, { content: activeProposalContent }),
      m('.clear'),
      m(Listing, { content: inactiveProposalContent }),
      m('.clear'),
    ]);
  }
};

export default ProposalsPage;
