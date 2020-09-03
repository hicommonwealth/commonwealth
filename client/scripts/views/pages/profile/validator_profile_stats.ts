import m from 'mithril';
import { makeDynamicComponent } from 'models/mithril';
import app from 'state';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { Coin, formatCoin } from 'adapters/currency';
import { u32 } from '@polkadot/types';
import { Card, Spinner } from 'construct-ui';


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
    // SPINNER
    // if (!validators) return m('div', m(Card, {
    //   elevation: 1,
    //   class: 'home-card',
    //   fluid: true
    // }, m(Spinner, {
    //   fill: true,
    //   message: 'Loading Stats...',
    //   size: 'xs',
    //   style: 'visibility: visible; opacity: 1;'
    // })));
    return m('div',
      m(Card, {
        elevation: 1,
        class: 'home-card',
        fluid: true
      }, [ // Dummy Data for now
        m('tr',
          [
            m('th',
              'TOTAL STAKE'),
            m('th',
              'OWN STAKE'),
            m('th',
              'OTHER STAKE'),
            m('th',
              'COMMISION'),
            m('th',
              'ERA POINTS'),
            m('th',
              'APR'),
            m('th',
              'TOTAL OFFENCES'),
          ]),
        m('tr',
          [
            m('td',
              '5.53m EDG'),
            m('td',
              '2.40m EDG'),
            m('td',
              '3.13m EDG'),
            m('td',
              '100%'),
            m('td',
              '220'),
            m('td',
              '11.1%'),
            m('td',
              '0')
          ]),
        //     m('td',
        //       validators && formatCoin(app.chain.chain.coins(validators[vnode.attrs.address].exposure.total), true)),
        //     m('td',
        //       validators && formatCoin(app.chain.chain.coins(validators[vnode.attrs.address].exposure.own), true)),
        //     m('td',
        //       validators && formatCoin(app.chain.chain.coins(validators[vnode.attrs.address]
        //         .otherTotal), true)),
        //     m('td',
        //       validators && validators[vnode.attrs.address].commissionPer),
        //     m('td',
        //       validators && validators[vnode.attrs.address].eraPoints)
        //   ]),
        m('tr',
          [
            m('th',
              'TOTAL SLASHES'),
            m('th',
              'TOTAL REWARDS'),
            m('th',
              'IMONLINE'),
            m('th',
              'SLASHES (30 DAYS)'),
            m('th',
              'REWARDS (30 DAYS)')
          ]),
        m('tr',
          [
            m('td',
              '5 (1.23m EDG)'),
            m('td',
              '30 (3.29m EDG)'),
            m('td',
              '35.0%'),
            m('td',
              '0'),
            m('td',
              '3 (1.05m EDG)')
          ])
      ]));
  }
});

export default ValidatorStats;
