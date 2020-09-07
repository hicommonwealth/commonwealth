import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Button, Icons, Icon } from 'construct-ui';
import * as clipboard from 'clipboard-polyfill';
import { Unsubscribable } from 'rxjs';
import { externalLink, formatAddressShort, isSameAccount } from 'helpers';

import app from 'state';
import { Account, ChainBase } from 'models';


import Substrate from 'controllers/chain/substrate/main';
import SubstrateIdentity from 'controllers/chain/substrate/identity';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import User from 'views/components/widgets/user';
import EditProfileModal from 'views/modals/edit_profile_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import { getMaxListeners } from 'superagent';
import { ValidatorHeaderStats } from './validator_header_stats';
import validatorIdentity from '../validators/substrate/validator_identity';


function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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

export interface IProfileHeaderAttrs {
  account;
}

export interface IProfileHeaderState {
  subscription: Unsubscribable | null;
  identity: SubstrateIdentity | null;
  copied: boolean;
}

const ProfileHeader: m.Component<IProfileHeaderAttrs, IProfileHeaderState> = {
  view: (vnode) => {
    const { account } = vnode.attrs;
    // const onOwnProfile = account.chain === app.user.activeAccount?.chain?.id
    //   && account.address === app.user.activeAccount?.address;

    return m('.ProfileHeader', [
      m('.cover', [
        m('div.row-validator', m(validatorIdentity, { stash: account.address, onlyIcon:false }))
      ]),
      m('.bio-main', [
        m('.bio-left', [ // TODO: Rename class to non-bio to avoid confusion with Bio component
          m('.avatar', account.profile.getAvatar(90)),
        ]),
        m('.bio-right', [
          m('.name-row', [
            m('.User', account.profile.displayName, m(validatorIdentity, { stash: account.address, onlyIcon:true })),
            // TODO: Badges for identity verification, etc.
          ]),
          m('.info-row', [
            m('span.username.address', formatAddressShort(account.address)),
          ]),
        ]),
        m(ValidatorHeaderStats, { account, address: account.address }),
      ])
      // m('.bio-actions', [
      //   !onOwnProfile ? [
      //     editIdentityAction(account, vnode.state.identity),
      //     m(Button, {
      //       intent: 'primary',
      //       onclick: () => {
      //         app.modals.create({
      //           modal: EditProfileModal,
      //           data: { account },
      //         });
      //       },
      //       label: 'Edit profile'
      //     }),
      //   ] : [
      //     // TODO: actions for others' accounts
      //   ]
      // ]),
    ]);
  }
};

export default ProfileHeader;
