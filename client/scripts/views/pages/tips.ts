import 'pages/tips.scss';

import m from 'mithril';
import app from 'state';
import { Button, Tag } from 'construct-ui';

import { formatCoin } from 'adapters/currency';
import { ProposalType } from 'identifiers';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';

import { ChainBase } from 'models';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ProposalCard from 'views/components/proposal_card';
import loadSubstrateModules from 'views/components/load_substrate_modules';
import Listing from './listing';
import ErrorPage from './error';
import User from '../components/widgets/user';

const TipDetail: m.Component<{ tip: SubstrateTreasuryTip }> = {
  view: (vnode) => {
    const { tip } = vnode.attrs;
    const { who, reason } = tip.data;
    const beneficiary = app.chain.accounts.get(who);
    return m('.TipDetail', {
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
      m('.group', [
        m('.t-row', [
          m('p', 'Reason'),
        ]),
        m('.t-row', [
          m('.reason', reason),
        ]),
      ]),
      m('.group', [
        m('.t-row', [
          m('p', 'Beneficiary'),
        ]),
        m('.t-row', [
          m(User, {
            user: beneficiary,
            popover: true,
            showAddressWithDisplayName: true,
          }),
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
    return [ chain.treasury, chain.tips ];
  } else {
    throw new Error('invalid chain');
  }
}

const TipsPage: m.Component<{}> = {
  view: (vnode) => {
    const activeAccount = app.user.activeAccount;

    if (!app.chain || !app.chain.loaded) {
      if (app.chain?.base === ChainBase.Substrate && (app.chain as Substrate).chain?.timedOut) {
        return m(ErrorPage, {
          message: 'Chain connection timed out.',
          title: [
            'Tips',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ],
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: [
          'Tips',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
        showNewProposalButton: true,
      });
    }

    const modLoading = loadSubstrateModules('Tips', getModules);
    if (modLoading) return modLoading;

    const activeTips = (app.chain as Substrate).tips.store.getAll().filter((p) => !p.completed);
    const inactiveTips = (app.chain as Substrate).tips.store.getAll().filter((p) => p.completed);
    const activeTipContent = activeTips.length
      ? activeTips.map((tip) => m(ProposalCard, {
        proposal: tip,
        injectedContent: m(TipDetail, { tip }),
      }))
      : [ m('.no-proposals', 'None') ];

    const inactiveTipContent = inactiveTips.length
      ? inactiveTips.map((tip) => m(ProposalCard, {
        proposal: tip,
        injectedContent: m(TipDetail, { tip }),
      }))
      : [ m('.no-proposals', 'None') ];

    return m(Sublayout, {
      class: 'TipsPage',
      title: [
        'Tips',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      // stats
      m('.stats-box', [
        m('.stats-box-left', '💭'),
        m('.stats-box-right', [
          m('', [
            m('strong', 'Tips'),
            m('span', [
              ' are rewards paid by the treasury without first having a pre-determined stakeholder group come to consensus on payment amount.',
            ]),
          ]),
          m('', [
            m('.stats-box-stat', [
              'Treasury: ',
              app.chain && formatCoin((app.chain as Substrate).treasury.pot),
            ]),
            // TODO: display council/tippers
          ]),
          m('', [
            m(Button, {
              rounded: true,
              class: activeAccount ? '' : 'disabled',
              onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
                type: ProposalType.SubstrateTreasuryTip,
              }),
              label: 'New tip',
            }),
          ]),
        ]),
      ]),
      m('.clear'),
      m(Listing, {
        content: activeTipContent,
        columnHeader: 'Active Tips',
      }),
      m('.clear'),
      m(Listing, {
        content: inactiveTipContent,
        columnHeader: 'Inactive Tips',
      }),
      m('.clear'),
    ]);
  }
};

export default TipsPage;
