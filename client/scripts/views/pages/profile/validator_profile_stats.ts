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
import { response } from 'express';
// import { formatNumberShort } from 'shared/adapters/currency.ts';
import { ICommissionInfo } from 'controllers/chain/substrate/staking';
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
    lastHeader: any,
    annualPercentRate: ICommissionInfo;
  };
  results: any[];
  identity: SubstrateIdentity | null;
  fullYearSlashes: any;
  slashes: any
  imOnlinePerCent: any,
  fullYearImOnline: any
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
}
// getting dates for 1 previous year
let startDate = new Date();
startDate.setFullYear(startDate.getFullYear() - 1);
startDate = new Date(startDate);
let endDate = new Date();
export const ValidatorStats = makeDynamicComponent<IValidatorAttrs, IValidatorPageState>({
  getObservables: (attrs) => ({
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null,
    lastHeader: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.lastHeader
      : null,
      annualPercentRate: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.annualPercentRate
      : null
  }),
  oncreate: async (vnode) => {
    m.request({
      method: 'GET',
      url: '/api/getSlashes',
      params: { stash: vnode.attrs.address, startDate, endDate } // for getting data of 1 year
    }).then((response: any) => {
      vnode.state.fullYearSlashes = []
      if (response) {
        vnode.state.fullYearSlashes = response.result.slashes
      }
    }).catch((e: any) => {
      vnode.state.fullYearSlashes = []
    });
    m.request({
      method: 'GET',
      url: '/api/getSlashes',
      params: { stash: vnode.attrs.address } // for getting data for last 30 days
    }).then((response: any) => {
      vnode.state.slashes = []
      if (response) {
        vnode.state.slashes = response.result.slashes
      }
    }).catch((e: any) => {
      vnode.state.slashes = []
    });
    m.request({
      method: 'GET',
      url: '/api/getImOnline',
      params: { stash: vnode.attrs.address }
    }).then((response: any) => {
      vnode.state.imOnlinePerCent = 0
      if (response) {
        vnode.state.imOnlinePerCent = Object.values(response.result.validators[vnode.attrs.address])[0]
      }
    }).catch((e: any) => {
      vnode.state.imOnlinePerCent = 0
    });
  },
  view: (vnode) => {
    const { account } = vnode.attrs;
    const { slashes, fullYearSlashes, imOnlinePerCent } = vnode.state;
    let validators;
    if (vnode.state.dynamic.validators !== undefined) {
      validators = vnode.state.dynamic.validators;
    }
    const onOwnProfile = account.chain === app.user.activeAccount?.chain?.id
      && account.address === app.user.activeAccount?.address;
    // SPINNER TODOO: un comment this once it loads.
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
    let sumOfSlashes = slashes.reduce((a, b) => {
      return a + b
    }, 0);
    let sumOfFullYearSlashes = fullYearSlashes.reduce((a, b) => {
      return a + b
    }, 0);
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
                `${vnode.state.dynamic.annualPercentRate[vnode.attrs.address]}`)),
            m('.info-row-block',
              m('.profile-data-block',
                '11.1%'))), // STAKING.TS
          m('.own-total-offences',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL OFFENCES')),
            m('.info-row-block',
              m('.profile-data-block',
                '0'))), //MIR ROUTE
          m('.other-total-slashes',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL SLASHES')),
            m('.info-row-block',
              m('.profile-data-block',
                `${fullYearSlashes.length} (${formatNumberShort(sumOfFullYearSlashes / 1_000_000_000_000_000_000)} EDG)`))),
          m('.total-rewards',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL REWARDS')),
            m('.info-row-block',
              m('.profile-data-block',
                '30 (3.29m EDG)'))), //MIR ROUTE
          m('.button-set-identity',
            m('.data-row-block',
              m('.profile-header-block',
                m('.bio-actions-edit-profile', [
                  !onOwnProfile ? [
                    m(Button, {
                      intent: 'primary',
                      onclick: () => {
                        app.modals.create({
                          modal: EditProfileModal,
                          data: { account },
                        });
                      },
                      label: 'Edit profile'
                    }),
                  ] : [
                      // TODO: actions for others' accounts
                    ]
                ])))),
        ]),
        m('div.profile-stats-row2.row', [
          m('.imonline',
            m('.data-row-block',
              m('.profile-header-block',
                'IMONLINE')),
            m('.info-row-block',
              m('.profile-data-block',
                `${imOnlinePerCent}%`))),
          m('.offences-days',
            m('.data-row-block',
              m('.profile-header-block',
                'OFFENCES (30 DAYS)')),
            m('.info-row-block',
              m('.profile-data-block',
                '0'))), // MIR ROUTE
          m('.slashes-days',
            m('.data-row-block',
              m('.profile-header-block',
                'SLASHES (30 DAYS)')),
            m('.info-row-block',
              m('.profile-data-block',
              `${slashes.length} (${formatNumberShort(sumOfSlashes / 1_000_000_000_000_000_000)} EDG)`))),
          m('.rewards-days',
            m('.data-row-block',
              m('.profile-header-block',
                'REWARDS (30 DAYS)')),
            m('.info-row-block',
              m('.profile-data-block',
                '11 (1.52m EDG)'))),
          m('.button-set-identity',
            m('.info-row-block',
              m('.profile-data-block',
                m('.bio-actions-edit-identity', [
                  !onOwnProfile ? [
                    editIdentityAction(account, vnode.state.identity)
                  ] : [
                      // TODO: actions for others' accounts
                    ]
                ])))),
        ])
      ]));
  }
});
export default ValidatorStats;