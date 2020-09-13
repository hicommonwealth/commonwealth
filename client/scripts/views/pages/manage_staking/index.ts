import 'pages/validators.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import PageLoading from 'views/pages/loading';
import { makeDynamicComponent } from 'models/mithril';
import app from 'state';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { StakerState, extractBondedTotal } from 'controllers/chain/substrate/staking';
import { ChainClass, ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Sublayout from 'views/sublayout';
import { Spinner } from 'construct-ui';
import * as CosmosValidationViews from '../validators/cosmos';
import { SubstratePreHeader, SubstratePresentationComponent } from './substrate';

export interface IValidatorPageState {
  dynamic: {
    ownStashInfos: StakerState[];
  };
}

export const Validators = makeDynamicComponent<{}, IValidatorPageState>({
  getObservables: () => ({
    groupKey: app.chain.class.toString(),
    ownStashInfos: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.ownStashInfos
      : null
  }),
  view: (vnode) => {
    const { ownStashInfos } = vnode.state.dynamic;
    if (!ownStashInfos)
      return m(Spinner, {
        fill: true,
        message: '',
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      });

    const { bondedTotal } = extractBondedTotal(ownStashInfos);

    let vComponents = [];
    switch (app.chain.class) {
      case ChainClass.Edgeware:
      case ChainClass.Kusama:
      case ChainClass.Polkadot:
        vComponents = [
          m(SubstratePreHeader, {
            sender: app.user.activeAccount as SubstrateAccount,
            bondedTotal
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


const ValidatorPage: m.Component = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ValidatorPage' });
  },
  view: (vnode) => {
    if (!app.chain) return m(PageLoading, { message: 'Chain is loading...' });

    return m(Sublayout, {
      class: 'ManageStakingPage',
    }, [
      m(Validators),
      m('.clear'),
    ]);
  },
};

export default ValidatorPage;
