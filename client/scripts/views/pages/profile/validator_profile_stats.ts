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

export const ValidatorStats = makeDynamicComponent<IValidatorAttrs, IValidatorPageState>({
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
                '11.1%'))),
          m('.own-total-offences',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL OFFENCES')),
            m('.info-row-block',
              m('.profile-data-block',
                '0'))),
          m('.other-total-slashes',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL SLASHES')),
            m('.info-row-block',
              m('.profile-data-block',
                '5 (1.23m EDG)'))),
          m('.total-rewards',
            m('.data-row-block',
              m('.profile-header-block',
                'TOTAL REWARDS')),
            m('.info-row-block',
              m('.profile-data-block',
                '30 (3.29m EDG)'))),
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
                '100%'))),
          m('.offences-days',
            m('.data-row-block',
              m('.profile-header-block',
                'OFFENCES (30 DAYS)')),
            m('.info-row-block',
              m('.profile-data-block',
                '0'))),
          m('.slashes-days',
            m('.data-row-block',
              m('.profile-header-block',
                'SLASHES (30 DAYS)')),
            m('.info-row-block',
              m('.profile-data-block',
                '3 (1.05m EDG)'))),
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
