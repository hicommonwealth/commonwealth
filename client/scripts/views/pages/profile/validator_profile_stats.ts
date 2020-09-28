import m from 'mithril';
import { makeDynamicComponent } from 'models/mithril';
import 'pages/validatorprofile.scss';
import app from 'state';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { Coin, formatCoin, formatNumberShort } from 'adapters/currency';
import { u32 } from '@polkadot/types';
import { Card, Spinner, Button } from 'construct-ui';
import EditProfileModal from 'views/modals/edit_profile_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import SubstrateIdentity from 'controllers/chain/substrate/identity';
import { ICommissionInfo } from 'controllers/chain/substrate/staking';
import $ from 'jquery';

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
    chainName: any
  };
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
  account: any,
  apiResponse: any
}

const itemLoadingSpinner = () => m(Spinner, { active: true, fill: false, size: 'xs' });

export const ValidatorStats = makeDynamicComponent<IValidatorAttrs, IValidatorPageState>({
  getObservables: (attrs) => ({
    groupKey: app.chain.class.toString(),
    chainName: app.chain.name.toString()
  }),
  oncreate: async (vnode) => {
  },
  view: (vnode) => {
    return m('div.validator-profile-stats',
      m(Card, {
        elevation: 0,
        class: 'home-card',
        fluid: true
      }, [ // Dummy Data for now TODOO: Change it to provide real data
        m('div.profile-stats-row1.row', [
          m('.total-apr', // TODOO: Integrate real data here.
            m('.data-row-block',
              m('.profile-header-block',
                'APR')),
            m('.info-row-block',
              m('.profile-data-block',
                vnode.attrs.apiResponse ? `${vnode.attrs.apiResponse.apr}%` : m('spinner', itemLoadingSpinner())))),
          m('.own-total-offences',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL OFFENCES')),
            m('.info-row-block',
              m('.profile-data-block',
                vnode.attrs.apiResponse ? `${vnode.attrs.apiResponse.offenceOver30Days}` : m('spinner', itemLoadingSpinner())))),
          m('.other-total-slashes',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL SLASHES')),
            m('.info-row-block',
              m('.profile-data-block',
                vnode.attrs.apiResponse ? `${vnode.attrs.apiResponse?.totalSlashesCount} (${(formatCoin(app.chain.chain.coins(+vnode.attrs.apiResponse?.totalSlashesValue), true))})` : m('spinner', itemLoadingSpinner())))),
          m('.total-rewards',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL REWARDS')),
            m('.info-row-block',
              m('.profile-data-block',
                vnode.attrs.apiResponse ? `${vnode.attrs.apiResponse?.totalRewardsCount} (${formatCoin(app.chain.chain.coins(+vnode.attrs.apiResponse?.totalRewardsValue), true)})` : m('spinner', itemLoadingSpinner())))),
          m('.bio-actions-edit-profile',
            m('.data-row-block',
              m(Button, { label: 'Validator Profile' }))),
        ]),
        m('div.profile-stats-row2.row', [
          m('.imonline',
            m('.data-row-block',
              m('.profile-header-block',
                'IMONLINE')),
            m('.info-row-block',
              m('.profile-data-block',
                vnode.attrs.apiResponse ? `${vnode.attrs.apiResponse?.imOnline}%` : m('spinner', itemLoadingSpinner())))),
          m('.offences-days',
            m('.data-row-block',
              m('.profile-header-block',
                'OFFENCES (30 DAYS)')),
            m('.info-row-block',
              m('.profile-data-block',
                vnode.attrs.apiResponse ? `${vnode.attrs.apiResponse?.offenceOver30Days}` : m('spinner', itemLoadingSpinner())))),
          m('.slashes-days',
            m('.data-row-block',
              m('.profile-header-block',
                'SLASHES (30 DAYS)')),
            m('.info-row-block',
              m('.profile-data-block',
                vnode.attrs.apiResponse ? `${vnode.attrs.apiResponse?.slashesOver30DaysCount} (${formatCoin(app.chain.chain.coins(+vnode.attrs.apiResponse?.slashesOver30DaysValue), true)})` : m('spinner', itemLoadingSpinner())))),
          m('.rewards-days',
            m('.data-row-block',
              m('.profile-header-block',
                'REWARDS (30 DAYS)')),
            m('.info-row-block',
              m('.profile-data-block',
                vnode.attrs.apiResponse ? `${vnode.attrs.apiResponse?.rewardsOver30DaysCount} (${formatCoin(app.chain.chain.coins(+vnode.attrs.apiResponse?.rewardsOver30DaysValue), true)})` : m('spinner', itemLoadingSpinner())))),
          m('.bio-actions-edit-identity',
            m('.info-row-block',
              m(Button, { label: 'Another Button' }))),
        ])
      ]));
  }
});
export default ValidatorStats;
