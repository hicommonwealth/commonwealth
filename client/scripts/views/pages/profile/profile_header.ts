import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import app from 'state';
import * as clipboard from 'clipboard-polyfill';
import { Account, ChainBase } from 'models';
import { Unsubscribable } from 'rxjs';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateIdentity from 'controllers/chain/substrate/identity';
import { formatAddressShort } from '../../../helpers';
import EditProfileModal from '../../modals/edit_profile_modal';
import { SubstrateAccount } from '../../../controllers/chain/substrate/account';
import EditIdentityModal from '../../modals/edit_identity_modal';
import User from '../../components/widgets/user';
import ValidatorStat from './profile_header_stats';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const editIdentityAction = (account: Account<any>, currentIdentity: SubstrateIdentity) => {
  const chainName = capitalizeFirstLetter(app.chain.class);
  return (app.chain.base === ChainBase.Substrate) && m('button.formular-button-primary', {
    // wait for info to load before making it clickable
    class: currentIdentity ? '' : 'disabled',
    onclick: async () => {
      app.modals.create({
        modal: EditIdentityModal,
        data: { account: account as SubstrateAccount, currentIdentity },
      });
    },
  }, currentIdentity?.exists ? `Edit ${chainName} identity` : `Set ${chainName} identity`);
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
    const onOwnProfile = app.user.activeAccount && account.address === app.user.activeAccount.address;

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
            m(User, { user: account, hideAvatar: true }),
            m(ValidatorStat, { address: account.address })
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
            m('button.formular-button-primary', {
              onclick: () => {
                app.modals.create({
                  modal: EditProfileModal,
                  data: account
                });
              },
            }, 'Edit profile'),
          ] : [
            // TODO: actions for others' accounts
          ]
        ]),
      ])
    ]);
  }
};

export default ProfileHeader;
