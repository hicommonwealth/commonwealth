import 'pages/proposals.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';


import { formatCoin } from 'adapters/currency';
import { formatDuration, blockperiodToDuration } from 'helpers';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase, AnyProposal } from 'models';
import Edgeware from 'controllers/chain/edgeware/main';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import ProposalRow from 'views/components/proposal_row';
import { CountdownUntilBlock } from 'views/components/countdown';
import Substrate from 'controllers/chain/substrate/main';
import NewProposalPage from 'views/pages/new_proposal/index';
import { Grid, Col, List } from 'construct-ui';
import moment from 'moment';
import Listing from './listing';
import ErrorPage from './error';
import User from '../components/widgets/user';
import { SubstrateTreasuryProposal } from 'client/scripts/controllers/chain/substrate/treasury_proposal';


const SubstrateBountyStats: m.Component<{}> = {
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
  }
};

async function loadCmd() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base !== ChainBase.Substrate) {
    return;
  }
  const chain = (app.chain as Substrate);
  await chain.treasury.init(chain.chain, chain.accounts);
}

const BountyRow: m.Component<{bounty: AnyProposal}> = {
  view: (vnode) => {
    const { bounty } = vnode.attrs;
    return m('', [
      m('h4', `${bounty.title}`),
      m('span', `bond: ${(bounty as SubstrateTreasuryProposal).bond.format(true)}`),
      m('span', 'managed by '),
      m(User, { user: bounty.author }),
    ]);
  }
};

const BountyPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      if (app.chain?.base === ChainBase.Substrate && (app.chain as Substrate).chain?.timedOut) {
        return m(ErrorPage, {
          message: 'Chain connection timed out.',
          title: 'Bounties',
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain (may take up to 10s)...',
        title: 'Bounties',
        showNewProposalButton: true,
      });
    }
    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;
    if (onSubstrate && !(app.chain as Substrate).treasury.initialized) {
      if (!(app.chain as Substrate).treasury.initializing) loadCmd();
      return m(PageLoading, {
        message: 'Connecting to chain (may take up to 10s)...',
        title: 'Bounties',
        showNewProposalButton: true,
      });
    }

    const activeBounties = (app.chain as Substrate).treasury.store.getAll().filter((p) => !p.completed);
    const inactiveBounties = (app.chain as Substrate).treasury.store.getAll().filter((p) => p.completed);
    console.log(activeBounties.length, inactiveBounties.length);
    const activeBountyContent = activeBounties.length
      ? activeBounties.map((bounty) => m(BountyRow, { bounty }))
      : [ m('.no-proposals', 'None') ];

    const inactiveBountyContent = inactiveBounties.length
      ? inactiveBounties.map((bounty) => m(BountyRow, { bounty }))
      : [ m('.no-proposals', 'None') ];
    console.log(inactiveBountyContent);

    return m(Sublayout, {
      class: 'BountiesPage TreasuryPage',
      title: 'Bounties',
      showNewProposalButton: true,
    }, [
      m(SubstrateBountyStats),
      m(Listing, {
        content: activeBountyContent,
        columnHeaders: ['Active Bounties'],
        rightColSpacing: [0]
      }),
      m(Listing, {
        content: inactiveBountyContent,
        columnHeaders: ['Inactive Bounties'],
        rightColSpacing: [0]
      })
    ]);
  }
};

export default BountyPage;
