import 'pages/referenda.scss';

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
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import ProposalRow from 'views/components/proposal_row';
import { CountdownUntilBlock } from 'views/components/countdown';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import NewProposalPage from 'views/pages/new_proposal/index';
import { Grid, Col, List, Tag } from 'construct-ui';
import moment from 'moment';
import Listing from './listing';
import ErrorPage from './error';

const SubstrateProposalStats: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain) return;

    return m('.stats-box', [
      m('.stats-box-left', '💭'),
      m('.stats-box-right', [
        m('', [
          m('strong', 'Referenda'),
          m('span', [
            ' are final votes required to enact most governance actions. ',
            'A referendum can approve/reject a treasury proposal, upgrade the chain, change technical parameters, or perform a batch of actions.',
            'Referendum voters may elect to lock their coins for 8 days to 196 days, for 1x to 6x weight. Only the winning side’s coins will be locked.'
            // TODO fix numbers
          ]),
        ]),
        m('', [
          m('.stats-box-stat', [
            'Next referendum launches: ',
            (app.chain as Substrate).democracyProposals.nextLaunchBlock
              ? m(CountdownUntilBlock, {
                block: (app.chain as Substrate).democracyProposals.nextLaunchBlock,
                includeSeconds: false
              })
              : '--',
          ]),
          m('.stats-box-stat', [
            'Enactment delay: ',
            (app.chain as Substrate).democracy.enactmentPeriod
              ? blockperiodToDuration((app.chain as Substrate).democracy.enactmentPeriod).asDays()
              : '--',
            ' days'
          ]),
        ]),
      ]),
    ]);
  }
};

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = (app.chain as Substrate);
    return [ chain.treasury, chain.democracy, chain.democracyProposals ];
  } else {
    throw new Error('invalid chain');
  }
}

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
    if (!app.chain || !app.chain.loaded) {
      if (app.chain?.base === ChainBase.Substrate && (app.chain as Substrate).chain?.timedOut) {
        return m(ErrorPage, {
          message: 'Could not connect to chain',
          title: [
            'Referenda',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ],
        });
      }
      return m(PageLoading, {
        message: 'Loading referenda',
        title: [
          'Referenda',
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
            'Referenda',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ],
          showNewProposalButton: true,
        });
      }
    }

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
      title: [
        'Referenda',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      onSubstrate && m(SubstrateProposalStats),
      m(Listing, {
        content: activeProposalContent,
        columnHeader: 'Active Referenda',
      }),
      m(Listing, {
        content: inactiveProposalContent,
        columnHeader: 'Inactive Referenda',
      }),
    ]);
  }
};

export default ReferendaPage;
