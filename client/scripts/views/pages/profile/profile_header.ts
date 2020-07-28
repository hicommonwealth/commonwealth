import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Button } from 'construct-ui';
import * as clipboard from 'clipboard-polyfill';
import { Unsubscribable } from 'rxjs';

import app from 'state';
import { Account, ChainBase } from 'models';

import { formatAddressShort } from 'helpers';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateIdentity from 'controllers/chain/substrate/identity';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import User from 'views/components/widgets/user';
import EditProfileModal from 'views/modals/edit_profile_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const editIdentityAction = (account: Account<any>, currentIdentity: SubstrateIdentity) => {
  const chainName = capitalizeFirstLetter(app.chain.class);
  return (account.chainBase === ChainBase.Substrate) && m(Button, {
    intent: 'primary',
    // wait for info to load before making it clickable
    class: currentIdentity ? '' : 'disabled',
    onclick: async () => {
      app.modals.create({
        modal: EditIdentityModal,
        data: { account: account as SubstrateAccount, currentIdentity },
      });
    },
    label: currentIdentity?.exists ? `Edit ${chainName} identity` : `Set ${chainName} identity`
  });
};

export interface IProfileHeaderAttrs {
  account: Account<any>;
}

export interface IProfileHeaderState {
  subscription: Unsubscribable | null;
  identity: SubstrateIdentity | null;
  copied: boolean;
}

const ProfileHeader: m.Component<IProfileHeaderAttrs, IProfileHeaderState> = {
  view: (vnode) => {
    const account: Account<any> = vnode.attrs.account;
    // const onOwnProfile = app.user.activeAccount && account.address === app.user.activeAccount.address;
    const onOwnProfile = false;
    // kick off identity subscription
    if (onOwnProfile && app.chain.loaded && app.chain.base === ChainBase.Substrate && !vnode.state.subscription) {
      vnode.state.subscription = (app.chain as Substrate).identities.get(account as SubstrateAccount)
        .subscribe((identity) => { vnode.state.identity = identity; });
    }

    return m('.ProfileHeader', [
      m('.cover'),
      m('.bio-main', [
        m('.bio-left', [ // TODO: Rename class to non-bio to avoid confusion with Bio component
          m('.avatar', account.profile.getAvatar(90)),
        ]),
        m('.bio-right', [
          m('.name-row', [
            m('.User', account.profile.displayName),
            // TODO: Badges for identity verification, etc.
          ]),
          m('.info-row', [
            m('span.profile-headline', account.profile && account.profile.headline
              ? account.profile.headline
              : m('.no-headline', 'No headline')),
            m('span.username', formatAddressShort(account.address)),
            !vnode.state.copied && m('a.copy-address', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                clipboard.writeText(account.address);
                vnode.state.copied = true;
                setTimeout(() => {
                  $(e.target).next('.copy-done').fadeOut(1000).promise()
                    .done(() => {
                      vnode.state.copied = false;
                      m.redraw();
                    });
                }, 1500);
              }
            }, 'Copy address'),
            vnode.state.copied && m('span.copy-done', 'Copied'),
          ]),
        ]),
        // Add in identity actions here
        m('.bio-actions', [
          onOwnProfile ? [
            editIdentityAction(account, vnode.state.identity),
            m(Button, {
              intent: 'primary',
              onclick: () => {
                app.modals.create({
                  modal: EditProfileModal,
                  data: account
                });
              },
              label: 'Edit profile'
            }),
          ] : [
            // TODO: actions for others' accounts
          ]
        ]),
      ])
    ]);
  }
};

export default ProfileHeader;
