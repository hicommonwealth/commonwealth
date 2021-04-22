import 'pages/bounties.scss';

import m from 'mithril';
import app from 'state';
import { Grid, Col, List, Tag } from 'construct-ui';

import { formatCoin } from 'adapters/currency';
import { formatDuration, blockperiodToDuration } from 'helpers';

import { ChainBase } from 'models';
import { CountdownUntilBlock } from 'views/components/countdown';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ProposalCard from 'views/components/proposal_card';
import Substrate from 'controllers/chain/substrate/main';
import Listing from './listing';
import ErrorPage from './error';

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [chain.bounties, chain.treasury];
  } else {
    throw new Error('invalid chain');
  }
}

const BountiesPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return m(ErrorPage, {
          message: 'Chain connection timed out.',
          title: [
            'Bounties',
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
          'Bounties',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      });
    }

    const onSubstrate = app.chain?.base === ChainBase.Substrate;
    if (onSubstrate) {
      const modules = getModules();
      if (modules.some((mod) => !mod.ready)) {
        app.chain.loadModules(modules);
        return m(PageLoading, {
          message: 'Loading bounties',
          title: [
            'Bounties',
            m(Tag, {
              size: 'xs',
              label: 'Beta',
              style: 'position: relative; top: -2px; margin-left: 6px',
            }),
          ],
          showNewProposalButton: true,
        });
      }
    }

    const activeBounties = (app.chain as Substrate).bounties.store
      .getAll()
      .filter((p) => !p.completed);
    const inactiveBounties = (app.chain as Substrate).bounties.store
      .getAll()
      .filter((p) => p.completed);
    const activeBountyContent = activeBounties.length
      ? activeBounties.map((bounty) => m(ProposalCard, { proposal: bounty }))
      : [m('.no-proposals', 'None')];

    const inactiveBountyContent = inactiveBounties.length
      ? inactiveBounties.map((bounty) => m(ProposalCard, { proposal: bounty }))
      : [m('.no-proposals', 'None')];

    return m(
      Sublayout,
      {
        class: 'BountiesPage',
        title: [
          'Bounties',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      },
      [
        // stats
        m('.stats-box', [
          m('.stats-box-left', '💭'),
          m('.stats-box-right', [
            m('', [
              m('strong', 'Bounties'),
              m('span', [
                ' are requests for treasury funding that are assigned by the council to be managed by a curator.',
              ]),
            ]),
            m('', [
              m('.stats-box-stat', [
                'Treasury: ',
                app.chain && formatCoin((app.chain as Substrate).treasury.pot),
              ]),
            ]),
          ]),
        ]),
        m('.clear'),
        m(Listing, {
          content: activeBountyContent,
          columnHeader: 'Active Bounties',
        }),
        m('.clear'),
        m(Listing, {
          content: inactiveBountyContent,
          columnHeader: 'Inactive Bounties',
        }),
        m('.clear'),
      ]
    );
  },
};

export default BountiesPage;
