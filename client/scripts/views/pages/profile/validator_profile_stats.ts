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
    validators: any,
    lastHeader: any,
    annualPercentRate: ICommissionInfo;
  };
  results: any[];
  identity: SubstrateIdentity | null;
  slashes: any;
  fullYearSlashes: any;
  imOnlinePerCent: any;
  rewards: any;
  fullYearRewards: any;
  offences: any;
  fullYearOffences: any;
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
const endDate = new Date();

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
    try { // rewards for a year
      const rewardsResponse = await $.get(`${app.serverUrl()}/getRewards`, { chain: app.chain.class, stash: vnode.attrs.address, startDate, endDate });
      vnode.state.fullYearRewards = [];
      vnode.state.fullYearRewards = Object.values(rewardsResponse.result.validators[vnode.attrs.address]) || [];
    } catch (e) {
      vnode.state.fullYearRewards = [];
    }
    try { // rewards for a 30 days
      const rewardsResponse = await $.get(`${app.serverUrl()}/getRewards`, { chain: app.chain.class, stash: vnode.attrs.address });
      vnode.state.rewards = [];
      vnode.state.rewards = Object.values(rewardsResponse.result.validators[vnode.attrs.address]) || [];
    } catch (e) {
      vnode.state.rewards = [];
    }
    try { // slashes for a year
      const slashesResponse = await $.get(`${app.serverUrl()}/getSlashes`, { chain: app.chain.class, stash: vnode.attrs.address, startDate, endDate });
      vnode.state.fullYearSlashes = [];
      vnode.state.fullYearSlashes = slashesResponse.result.slashes || [];
    } catch (e) {
      vnode.state.fullYearSlashes = [];
    }
    try { // slash for 30 days
      const slashesResponse = await $.get(`${app.serverUrl()}/getSlashes`, { chain: app.chain.class, stash: vnode.attrs.address });
      vnode.state.slashes = [];
      vnode.state.slashes = slashesResponse.result.slashes || [];
    } catch (e) {
      vnode.state.slashes = [];
    }
    try {
      const imOnlineResponse = await $.get(`${app.serverUrl()}/getImOnline`, { chain: app.chain.class, stash: vnode.attrs.address });
      vnode.state.imOnlinePerCent = 0;
      vnode.state.imOnlinePerCent = Object.values(imOnlineResponse.result.validators[vnode.attrs.address])[0];
    } catch (e) {
      vnode.state.imOnlinePerCent = 0;
    }
    try { // offences for a year
      const offencesResponse = await $.get(`${app.serverUrl()}/getOffences`, { stash: vnode.attrs.address, chain: app.chain.class, startDate, endDate });
      vnode.state.fullYearOffences = 0;
      vnode.state.fullYearOffences = Object.keys(offencesResponse.result.validators[vnode.attrs.address]).length;
    } catch (e) {
      vnode.state.fullYearOffences = 0;
    }
    try { // offences for 30 days
      const offencesResponse = await $.get(`${app.serverUrl()}/getOffences`, { stash: vnode.attrs.address, chain: app.chain.class });
      vnode.state.offences = 0;
      vnode.state.offences = Object.keys(offencesResponse.result.validators[vnode.attrs.address]).length;
    } catch (e) {
      vnode.state.offences = 0;
    }
  },
  view: (vnode) => {
    const { account } = vnode.attrs;
    const { slashes, fullYearSlashes, rewards, fullYearRewards, offences, fullYearOffences, imOnlinePerCent } = vnode.state;

    // TODO: clean this to pass a better UX for waiting.
    if (!vnode.state.dynamic || !vnode.state.dynamic.validators) {
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
                  '- %'))),
            m('.own-total-offences',
              m('.data-row-block',
                m('.profile-header-block',
                  'TOTAL OFFENCES')),
              m('.info-row-block',
                m('.profile-data-block',
                  '-'))), // MIR ROUTE
            m('.other-total-slashes',
              m('.data-row-block',
                m('.profile-header-block',
                  'TOTAL SLASHES')),
              m('.info-row-block',
                m('.profile-data-block',
                  '-'))), // `${fullYearSlashes.length} (${formatNumberShort(sumOfFullYearSlashes / 1_000_000_000_000_000_000)} EDG)`
            m('.total-rewards',
              m('.data-row-block',
                m('.profile-header-block',
                  'TOTAL REWARDS')),
              m('.info-row-block',
                m('.profile-data-block',
                  '-'))),
            m('.button-set-identity',
              m('.data-row-block',
                m('.profile-header-block',
                  m('.bio-actions-edit-profile', [
                  ])))),
          ]),
          m('div.profile-stats-row2.row', [
            m('.imonline',
              m('.data-row-block',
                m('.profile-header-block',
                  'IMONLINE')),
              m('.info-row-block',
                m('.profile-data-block',
                  '-'))),
            m('.offences-days',
              m('.data-row-block',
                m('.profile-header-block',
                  'OFFENCES (30 DAYS)')),
              m('.info-row-block',
                m('.profile-data-block',
                  '-'))),
            m('.slashes-days',
              m('.data-row-block',
                m('.profile-header-block',
                  'SLASHES (30 DAYS)')),
              m('.info-row-block',
                m('.profile-data-block',
                  '-'))),
            m('.rewards-days',
              m('.data-row-block',
                m('.profile-header-block',
                  'REWARDS (30 DAYS)')),
              m('.info-row-block',
                m('.profile-data-block',
                  '-'))),
            m('.button-set-identity',
              m('.info-row-block',
                m('.profile-data-block',
                  m('.bio-actions-edit-identity', [
                  ])))),
          ])
        ]));
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
    const sumOfSlashes = slashes.reduce((a, b) => {
      return a + b;
    }, 0);
    const sumOfFullYearSlashes = fullYearSlashes.reduce((a, b) => {
      return a + b;
    }, 0);
    const sumOfRewards = rewards.reduce((a, b) => {
      return a + b;
    }, 0);
    const sumOfFullYearRewards = fullYearRewards.reduce((a, b) => {
      return a + b;
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
                'APR')),
            m('.info-row-block',
              m('.profile-data-block',
                `${Number(vnode.state.dynamic.annualPercentRate[vnode.attrs.address]).toFixed(2)}%`))),
          m('.own-total-offences',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL OFFENCES')),
            m('.info-row-block',
              m('.profile-data-block',
                `${fullYearOffences}`))),
          m('.other-total-slashes',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL SLASHES')),
            m('.info-row-block',
              m('.profile-data-block',
                `${fullYearSlashes.length} (${formatNumberShort(sumOfFullYearSlashes / 1_000_000_000_000_000_000)} EDG)`))), // `${fullYearSlashes.length} (${formatNumberShort(sumOfFullYearSlashes / 1_000_000_000_000_000_000)} EDG)`
          m('.total-rewards',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL REWARDS')),
            m('.info-row-block',
              m('.profile-data-block',
                `${fullYearRewards.length} (${formatNumberShort(sumOfFullYearRewards / 1_000_000_000_000_000_000)} EDG)`))), // `${fullYearSlashes.length} (${formatNumberShort(sumOfFullYearSlashes / 1_000_000_000_000_000_000)} EDG)`
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
                `${imOnlinePerCent}%`))),
          m('.offences-days',
            m('.data-row-block',
              m('.profile-header-block',
                'OFFENCES (30 DAYS)')),
            m('.info-row-block',
              m('.profile-data-block',
                `${offences}`))),
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
                `${rewards.length} (${formatNumberShort(sumOfRewards / 1_000_000_000_000_000_000)} EDG)`))),
          m('.bio-actions-edit-identity',
            m('.info-row-block',
              m(Button, { label: 'Another Button' }))),
        ])
      ]));
  }
});
export default ValidatorStats;
