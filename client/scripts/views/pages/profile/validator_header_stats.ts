import m from 'mithril';
import { makeDynamicComponent } from 'models/mithril';
import app from 'state';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { Coin, formatCoin } from 'adapters/currency';
import { u32 } from '@polkadot/types';
import { Card, Spinner, Button } from 'construct-ui';
import EditProfileModal from 'views/modals/edit_profile_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import SubstrateIdentity from 'controllers/chain/substrate/identity';


const editIdentityAction = (account, currentIdentity: SubstrateIdentity) => {
  const chainObj = app.config.chains.getById(account.chain);
  if (!chainObj) return;

  // TODO: look up the chainObj's chain base
  return (account.chain.indexOf('edgeware') !== -1 || account.chain.indexOf('kusama') !== -1) && m(Button, {
    intent: 'primary',
    // wait for info to load before making it clickable
    class: currentIdentity ? '' : 'disabled',
    onclick: async () => {
      app.modals.create({
        modal: EditIdentityModal,
        data: { account, currentIdentity },
      });
    },
    label: currentIdentity?.exists ? `Edit ${chainObj.name} identity` : `Set ${chainObj.name} identity`
  });
};

export interface IValidatorPageState {
    dynamic: {
        validators: any,
        lastHeader:any
    };
    results: any[];
    identity: SubstrateIdentity | null;
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
    account:any
}

export const ValidatorHeaderStats = makeDynamicComponent<IValidatorAttrs, IValidatorPageState>({
  getObservables: (attrs) => ({
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null,
    lastHeader: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.lastHeader
      : null,
  }),
  view: (vnode) => {
    const { account } = vnode.attrs;
    let validators;
    if (vnode.state.dynamic.validators !== undefined) {
      validators = vnode.state.dynamic.validators;
    }
    const onOwnProfile = account.chain === app.user.activeAccount?.chain?.id
      && account.address === app.user.activeAccount?.address;
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
      [ // Dummy Data for now TODOO: Change it to provide real data
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
      ]);
  }
});

export default ValidatorHeaderStats;
