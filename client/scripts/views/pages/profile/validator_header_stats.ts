import m from 'mithril';
import { makeDynamicComponent } from 'models/mithril';
import 'pages/validatorprofile.scss';
import app from 'state';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { Coin, formatCoin } from 'adapters/currency';
import { u32 } from '@polkadot/types';
import { Card, Spinner, Button } from 'construct-ui';
import EditProfileModal from 'views/modals/edit_profile_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import SubstrateIdentity from 'controllers/chain/substrate/identity';
import { ViewNominatorsModal } from '../validators/index';

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
    lastHeader: any
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
  account: any
}

interface IValidatorStatsInfo {
  total: number
  own: number
  otherTotal: number
  commission: number
  points: number
}

const emptyValidatorStatsInfo: IValidatorStatsInfo = {
  total: undefined,
  own: undefined,
  otherTotal: undefined,
  commission: undefined,
  points: undefined,
};

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
    const validators = (vnode.state.dynamic && vnode.state.dynamic.validators !== undefined) ? vnode.state.dynamic.validators : undefined;
    const validatorStatInfo: IValidatorStatsInfo = validators ? (validators[vnode.attrs.address] ? {
      total: validators[vnode.attrs.address].exposure ? validators[vnode.attrs.address].exposure.total : undefined,
      own: validators[vnode.attrs.address].exposure ? validators[vnode.attrs.address].exposure.own : undefined,
      otherTotal: validators[vnode.attrs.address].otherTotal,
      commission: validators[vnode.attrs.address].commissionPer,
      points: validators[vnode.attrs.address].eraPoints,
    } : emptyValidatorStatsInfo) : emptyValidatorStatsInfo;
    let nominators;

    const onOwnProfile = account.chain === app.user.activeAccount?.chain?.id
      && account.address === app.user.activeAccount?.address;
    nominators =  (validators) ? validators[vnode.attrs.address].exposure.others.map(({ who, value }) => ({
      stash: who.toString(),
      balance: app.chain.chain.coins(value),
    })) : [];
    return [m('.total-stake',
      m('.data-row',
        m('.profile-header',
          'TOTAL STAKE')),
      m('.info-row',
        m('.profile-data',
          validators && formatCoin(app.chain.chain.coins(validatorStatInfo.total), true)))),
    m('.own-stake',
      m('.data-row',
        m('.profile-header',
          'OWN STAKE')),
      m('.info-row',
        m('.profile-data',
          validators && formatCoin(app.chain.chain.coins(validatorStatInfo.own), true)))),
    m('.other-stake',
      m('.data-row',
        m('.profile-header',
          'OTHER STAKE')), // TODOO: ADD A MODAL ON CLICK  by adding ViewNominatorsModal
      m('.info-row',
        m('.profile-data',
          validators && nominators.length === 0 && formatCoin(app.chain.chain.coins(validatorStatInfo.otherTotal), true),
          validators && nominators.length > 0 && [
            m('a.val-nominators.padding-left-2', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: ViewNominatorsModal,
                  data: { nominators, validatorAddr: vnode.attrs.address }
                });
              }
            }, `${formatCoin(app.chain.chain.coins(validatorStatInfo.otherTotal), true)} (${nominators.length})`)]))),
    m('.commision',
      m('.data-row',
        m('.profile-header',
          'COMMISION')),
      m('.info-row',
        m('.profile-data',
          validators && validatorStatInfo.commission))),
    m('.era-points',
      m('.data-row',
        m('.profile-header',
          'POINTS')),
      m('.info-row',
        m('.profile-data',
          validators && validatorStatInfo.points)))];
  }
});

export default ValidatorHeaderStats;
