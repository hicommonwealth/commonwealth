import 'pages/validators.scss';

import _ from 'lodash';
import m from 'mithril';
import { Tag } from 'construct-ui';

import app from 'state';
import { pluralize, externalLink } from 'helpers';
import { AddressInfo, ChainBase } from 'models';

import Substrate from 'controllers/chain/substrate/main';

import Sublayout from 'views/sublayout';
import User from 'views/components/widgets/user';
import PageLoading from 'views/pages/loading';
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
      m('.validator-stat', [
        info.total?.format(true),
        ' from ',
        pluralize(info.nominators, 'nominator'),
      ]),
      info.commission && m('.validator-stat', { style: 'color: #999' }, [
        info.commission,
        ' commission',
      ]),
    ]);
  }
};

const ValidatorsPage: m.Component<{}, { validators, totalStaked, validatorsInitialized: boolean }> = {
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
      (app.chain as Substrate).accounts.getValidators().then((result) => {
        vnode.state.validators = result;

        // calculate total staked
        vnode.state.totalStaked = (app.chain as Substrate).chain.coins(0);
        (result as any).forEach((va) => {
          vnode.state.totalStaked = (app.chain as Substrate).chain
            .coins(vnode.state.totalStaked.asBN.add(va.total.asBN));
        });
      });
      // TODO: handle error fetching vals
      vnode.state.validatorsInitialized = true;
      m.redraw();
    }
    const validators = vnode.state.validators;

    if (!validators) {
      return m(PageLoading, {
        message: 'Loading validators',
        title: [
          'Validators',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
        showNewProposalButton: true
      });
    }

    const sort = 'amount';
    // also: nominators, return

    return m(Sublayout, {
      class: 'ValidatorsPage',
      title: [
        'Validators',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      // stats
      m('.stats-box', [
        m('.stats-box-left', '💭'),
        m('.stats-box-right', [
          m('', [
            m('strong', 'Validators'),
            m('span', [
              ' are responsible for producing blocks and securing the network. Nominate validators to receive staking rewards.'
            ]),
          ]),
          m('', [
            m('.stats-box-stat', `Validators: ${validators?.length}`),
            m('.stats-box-stat', [
              `Total Staked: ${vnode.state.totalStaked.format(true)} / `,
              `${(app.chain as Substrate).chain.totalbalance.format(true)}`
            ]),
            app.chain?.meta?.url && m('.stats-box-action', [
              externalLink('a', `https://polkadot.js.org/apps/?rpc=${encodeURIComponent(app.chain?.meta?.url)}#/staking`, 'Nominate on polkadot-js'),
            ]),
          ]),
        ]),
      ]),
      // validators
      m('h3', 'Validators'),
      (sort === 'amount'
        ? validators?.sort((a, b) => b.total?.toString() - a.total?.toString())
        : sort === 'nominators'
          ? validators?.sort((a, b) => b.nominators - a.nominators)
          : validators?.sort((a, b) => b.expectedReturn - a.expectedReturn)
      ).map((info) => m(Validator, { info })),
      m('.clear'),
    ]);
  },
};

export default ValidatorsPage;
