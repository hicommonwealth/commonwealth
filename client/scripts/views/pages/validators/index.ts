import 'pages/validators.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { formatAddressShort } from 'helpers';
import { Coin, formatCoin } from 'adapters/currency';
import { makeDynamicComponent } from 'models/mithril';
import _ from 'lodash';
import { u32 } from '@polkadot/types';
import app, { ApiStatus } from 'state';
import { HeaderExtended } from '@polkadot/api-derive';
import { IValidators, SubstrateAccount } from 'controllers/chain/substrate/account';
import { ICosmosValidator } from 'controllers/chain/cosmos/account';
import User from 'views/components/widgets/user';
import PageLoading from 'views/pages/loading';
import { ChainBase, Account, ChainClass } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Tabs from 'views/components/widgets/tabs';
import { createTXModal } from 'views/modals/tx_signing_modal';
import Sublayout from 'views/sublayout';

import * as CosmosValidationViews from './cosmos';
import { SubstratePreHeader, SubstratePresentationComponent } from './substrate';

export interface IValidatorAttrs {
  stash: string;
  total: Coin;
  nominators?: any;
  error?: any;
  sending?: boolean;
  name?: string;
  bonded?: Coin;
  nominated?: Coin;
  controller?: string;
  hasNominated?: boolean;
  commissionPer?: number;
  onChangeHandler?: any;
  waiting?: boolean;
  eraPoints?: string;
  toBeElected?: boolean;
  blockCount?: u32;
  hasMessage?: boolean;
  isOnline?: boolean;
}

export interface IValidatorPageState {
  dynamic: {
    validators: IValidators | { [address: string]: ICosmosValidator };
    lastHeader: HeaderExtended
  };
  nominations: any[];
  originalNominations: any[];
  nominationsHasChanged: boolean;
  results: any[];
}

export const ViewNominatorsModal : m.Component<{ nominators, validatorAddr }> = {
  view: (vnode) => {
    return m('.ViewNominatorsModal', [
      m('.compact-modal-title', [
        m('h3', `Nominators for ${formatAddressShort(vnode.attrs.validatorAddr)}`),
      ]),
      m('.compact-modal-body', [
        m('table', [
          m('tr', [
            m('th', 'Nominator'),
            m('th', 'Amount'),
          ]),
          vnode.attrs.nominators.map((n) => {
            return m('tr', [
              m('td', m(User, {
                user: app.chain.accounts.get(n.stash),
                linkify: true,
                onclick: () => {
                  this.trigger('modalexit');
                }
              })),
              m('td', formatCoin(n.balance, true)),
            ]);
          }),
        ])
      ]),
    ]);
  }
};

export const Validators = makeDynamicComponent<{}, IValidatorPageState>({
  oninit: (vnode) => {
    vnode.state.nominations = [];
    vnode.state.originalNominations = [];
    vnode.state.nominationsHasChanged = false;
  },
  onupdate: (vnode) => {
    vnode.state.nominationsHasChanged = !_.isEqual(
      vnode.state.originalNominations.sort(),
      vnode.state.nominations.sort()
    );
    if (vnode.state.nominationsHasChanged) m.redraw();
  },
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null,
    currentSession: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).chain.session : null,
    currentEra: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).chain.currentEra : null,
    activeEra: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).chain.activeEra : null,
    stakingLedger: (app.chain.base === ChainBase.Substrate && app.vm.activeAccount)
      ? (app.vm.activeAccount as SubstrateAccount).stakingLedger
      : null,
    lastHeader: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.lastHeader
      : null
  }),
  view: (vnode) => {
    let vComponents = [];
    switch (app.chain.class) {
      case ChainClass.Edgeware:
        vComponents = [
          m(SubstratePreHeader, {
            sender: app.vm.activeAccount as SubstrateAccount,
            nominations: vnode.state.nominations,
            nominationsHasChanged: vnode.state.nominationsHasChanged
          }),
          SubstratePresentationComponent(vnode.state, app.chain as Substrate),
        ];
        break;
      case ChainClass.Kusama:
        vComponents = [
          m(SubstratePreHeader, {
            sender: app.vm.activeAccount as SubstrateAccount,
            nominations: vnode.state.nominations,
            nominationsHasChanged: vnode.state.nominationsHasChanged
          }),
          SubstratePresentationComponent(vnode.state, app.chain as Substrate),
        ];
        break;
      case ChainClass.CosmosHub:
        vComponents = [
          CosmosValidationViews.ValidationPreHeader(app.chain as Cosmos),
          CosmosValidationViews.ValidatorPresentationComponent(app.chain as Cosmos),
        ];
        break;
      default:
        break;
    }

    return m('.Validators', vComponents);
  }
});

const ValidatorPage : m.Component = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ValidatorPage' });
  },
  view: (vnode) => {
    if (!app.chain || app.chain.networkStatus !== ApiStatus.Connected) return m(PageLoading);

    // Catch a Substrate validators issue where app.chain.accounts.validators
    // makes a call using the API, which fails when API is not loaded.
    if (app.chain.base === ChainBase.Substrate) {
      try {
        (app.chain as Substrate).accounts.validators;
      } catch (e) {
        return m(PageLoading);
      }
    }

    return m(Sublayout, {
      class: 'ValidatorPage',
    }, [
      m(Validators),
      m('.clear'),
    ]);
  },
};

export default ValidatorPage;
