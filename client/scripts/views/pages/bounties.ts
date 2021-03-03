import 'pages/proposals.scss';

import m from 'mithril';
import app from 'state';

import { ChainBase } from 'models';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ProposalRow from 'views/components/proposal_row';
import Substrate from 'controllers/chain/substrate/main';
import Listing from './listing';
import ErrorPage from './error';

async function loadCmd() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base !== ChainBase.Substrate) {
    return;
  }
  const chain = (app.chain as Substrate);
  await chain.bounties.init(chain.chain, chain.accounts);
}

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

    const onSubstrate = app.chain?.base === ChainBase.Substrate;
    if (onSubstrate && !(app.chain as Substrate).bounties.initialized) {
      if (!(app.chain as Substrate).bounties.initializing) loadCmd();
      return m(PageLoading, {
        message: 'Connecting to chain (may take up to 10s)...',
        title: 'Bounties',
        showNewProposalButton: true,
      });
    }

    const activeBounties = (app.chain as Substrate).bounties.store.getAll().filter((p) => !p.completed);
    const inactiveBounties = (app.chain as Substrate).bounties.store.getAll().filter((p) => p.completed);
    const activeBountyContent = activeBounties.length
      ? activeBounties.map((bounty) => m(ProposalRow, { proposal: bounty }))
      : [ m('.no-proposals', 'None') ];

    const inactiveBountyContent = inactiveBounties.length
      ? inactiveBounties.map((bounty) => m(ProposalRow, { proposal: bounty }))
      : [ m('.no-proposals', 'None') ];

    return m(Sublayout, {
      class: 'BountiesPage TreasuryPage',
      title: 'Bounties',
      showNewProposalButton: true,
    }, [
      m(Listing, {
        content: activeBountyContent,
        columnHeader: 'Active Bounties',
      }),
      m(Listing, {
        content: inactiveBountyContent,
        columnHeader: 'Inactive Bounties',
      })
    ]);
  }
};

export default BountyPage;
