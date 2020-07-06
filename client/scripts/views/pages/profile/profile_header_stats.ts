import m from 'mithril';
import { makeDynamicComponent } from 'models/mithril';
import app from 'state';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { Coin, formatCoin } from 'adapters/currency';
import { u32 } from '@polkadot/types';


export interface IValidatorPageState {
    dynamic: {
        validators: any,
        lastHeader:any
    };
    results: any[];
}
export interface IValidatorAttrs {
    address: string;
    total?: Coin;
    otherTotal?: Coin;
    bonded?: Coin;
    commission?: number;
    toBeElected?: boolean;
    isOnline?: boolean;
    hasMessage?: boolean;
    blockCount?: u32;
}

export const ValidatorStats = makeDynamicComponent<IValidatorAttrs, IValidatorPageState>({
  getObservables: (attrs) => ({
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null,
    lastHeader: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.lastHeader
      : null,
  }),
  view: (vnode) => {
    let validators;
    if (vnode.state.dynamic.validators !== undefined) {
      validators = vnode.state.dynamic.validators;
    }
    return m('div',
      m('table',
        m('tbody',
          /* TODO: ADD A LOADER SPINNER !validators && m(PageLoading, { message: 'Loading Validators...' }),
          validators && */ [
            m('tr',
              [
                m('th',
                  'Total Stake'),
                m('th',
                  'Own Stake'),
                m('th',
                  'Other Stake'),
                m('th',
                  'Comission'),
                m('th',
                  'Era Points')
              ]),
            m('tr',
              [
                m('td',
                  validators && formatCoin(app.chain.chain.coins(validators[vnode.attrs.address].exposure.total), true)),
                m('td',
                  validators && formatCoin(app.chain.chain.coins(validators[vnode.attrs.address].exposure.own), true)),
                m('td',
                  validators && formatCoin(app.chain.chain.coins(validators[vnode.attrs.address]
                    .otherTotal), true)),
                m('td',
                  validators && validators[vnode.attrs.address].commissionPer),
                m('td',
                  validators && validators[vnode.attrs.address].eraPoints)
              ])
          ])));
  }
});

export default ValidatorStats;
