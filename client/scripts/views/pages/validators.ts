import 'pages/validators.scss';

import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Grid, Col, Button, MenuItem, Tag } from 'construct-ui';

import app, { ApiStatus } from 'state';
import { ProposalType } from 'identifiers';
import { formatNumberLong, pluralize, link } from 'helpers';
import { formatCoin } from 'adapters/currency';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { AddressInfo, ChainBase, ChainClass, IVote } from 'models';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_election';

import Sublayout from 'views/sublayout';
import User, { UserBlock } from 'views/components/widgets/user';
import { CountdownUntilBlock } from 'views/components/countdown';
import NewProposalPage from 'views/pages/new_proposal/index';
import { createTXModal } from 'views/modals/tx_signing_modal';
import CouncilVotingModal from 'views/modals/council_voting_modal';
import PageLoading from 'views/pages/loading';
import ViewVotersModal from 'views/modals/view_voters_modal';
import Listing from 'views/pages/listing';
import ErrorPage from 'views/pages/error';

const Validator: m.Component<{ info }> = {
  view: (vnode) => {
    if (!vnode.attrs.info) return;
    const { info } = vnode.attrs;

    return m('.Validator', [
      m(User, {
        user: new AddressInfo(null, info.stash, info.chain, null),
        popover: true,
        hideIdentityIcon: true
      }),
      m(User, {
        user: new AddressInfo(null, info.controller, info.chain, null),
        popover: true,
        hideIdentityIcon: true
      }),
      m('.validator-stat', info.total),
      m('.validator-stat', info.own),
      m('.validator-stat', pluralize(info.nominators, 'nominator')),
    ]);
  }
};

const ValidatorsPage: m.Component<{}, { validators, validatorsInitialized: boolean }> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      if (app.chain?.base === ChainBase.Substrate && (app.chain as Substrate).chain?.timedOut) {
        return m(ErrorPage, {
          message: 'Could not connect to chain',
          title: [
            'Validators',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ],
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: [
          'Validators',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
        showNewProposalButton: true
      });
    }

    if (app.chain?.base === ChainBase.Substrate && app.chain.apiInitialized && !vnode.state.validatorsInitialized) {
      vnode.state.validatorsInitialized = true;
      (app.chain as Substrate).accounts.validators.then((results) => {
        vnode.state.validators = Object.entries(results).map(([address, info]) => ({
          chain: app.chain.meta.chain.id,
          stash: address,
          controller: info.controller,
          isElected: info.isElected,
          total: info.exposure.total, // TODO: convert to Coins
          own: info.exposure.own, // TODO: convert to Coins
          nominators: info.exposure.others.length,
        }));
      });
      // TODO: handle error fetching vals
    }
    const validators = vnode.state.validators;

    return m(Sublayout, {
      class: 'ValidatorsPage',
      title: [
        'Validator',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      // stats
      m(Grid, {
        align: 'middle',
        class: 'stats-container',
        gutter: 5,
        justify: 'space-between'
      }, [
        m(Col, { span: { xs: 6, md: 4 } }, [
          m('.stats-heading', 'Validators'),
          m('.stats-tile', `${validators?.length}`),
//           -
// -    let totalStaked = (app.chain as Substrate).chain.coins(0);
// -    Object.entries(validators).forEach(([_stash, { exposure }]) => {
// -      const valStake = (app.chain as Substrate).chain.coins(exposure.total.toBn());
// -      totalStaked = (app.chain as Substrate).chain.coins(totalStaked.asBN.add(valStake.asBN));
// -    });
// -
// -    return m('.validators-preheader', [
// -      m('.validators-preheader-item', [
// -        m('h3', 'Total Supply'),
// -        m('.preheader-item-text', (app.chain as Substrate).chain.totalbalance.format(true)),
// -      ]),
// -      m('.validators-preheader-item', [
// -        m('h3', 'Total Staked'),
// -        m('.preheader-item-text', totalStaked.format(true)),
// -      ]),
// -    ]);
        ]),
      ]),
      // validators
      m('h3', 'Validators'),
      validators?.map((info) => m(Validator, { info })),
      m('.clear'),
    ]);
  },
};

export default ValidatorsPage;
