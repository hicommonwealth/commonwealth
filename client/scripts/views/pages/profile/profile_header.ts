import { confirmationModalWithText } from 'views/modals/confirm_modal';
import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Button } from 'construct-ui';
import * as clipboard from 'clipboard-polyfill';
import { Unsubscribable } from 'rxjs';

import { initChain } from 'app';
import app from 'state';
import { Account, ChainBase } from 'models';

import { formatAddressShort, isSameAccount } from 'helpers';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateIdentity from 'controllers/chain/substrate/identity';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import User from 'views/components/widgets/user';
import EditProfileModal from 'views/modals/edit_profile_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import { notifyError, notifySuccess } from 'client/scripts/controllers/app/notifications';
import { setActiveAccount } from 'client/scripts/controllers/app/login';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const editIdentityAction = (account, currentIdentity: SubstrateIdentity, vnode) => {
  const chainObj = app.config.chains.getById(account.chain);
  if (!chainObj) return;

  // TODO: look up the chainObj's chain base
  return (account.chain.indexOf('edgeware') !== -1 || account.chain.indexOf('kusama') !== -1) && m(Button, {
    intent: 'primary',
    // wait for info to load before making it clickable
    disabled: vnode.state.chainLoading,
    onclick: async () => {
      const chain = chainObj.name.toLowerCase();
      console.log({ chain });
      if (app.activeId() !== chain) {
        let confirmed = false;
        const msg = `Must switch to ${chainObj.name} to set on-chain identity. Continue?`;
        confirmed = await confirmationModalWithText(msg)();
        if (confirmed) {
          m.route.set(`/${chain}/account/${account.address}`, {
            offerJoin: true
          });
        }
      } else if (!app.chain?.loaded) {
        vnode.state.chainLoading = true;
        initChain().then(() => {
          vnode.state.chainLoading = false;
          app.modals.create({
            modal: EditIdentityModal,
            data: { account, currentIdentity },
          });
        }).catch((err) => {
          vnode.state.chainLoading = false;
        });
      } else {
        app.modals.create({
          modal: EditIdentityModal,
          data: { account, currentIdentity },
        });
      }
    },
    label: vnode.state.chainLoading
      ? 'Loading chain (may take some time)...'
      : currentIdentity?.exists ? `Edit ${chainObj.name} identity` : `Set ${chainObj.name} identity`
  });
};

export interface IProfileHeaderAttrs {
  account;
  showJoinCommunityButton: boolean;
  refreshCallback: Function;
}

export interface IProfileHeaderState {
  subscription: Unsubscribable | null;
  identity: SubstrateIdentity | null;
  copied: boolean;
  loading: boolean;
}

const ProfileHeader: m.Component<IProfileHeaderAttrs, IProfileHeaderState> = {
  view: (vnode) => {
    const { account, showJoinCommunityButton, refreshCallback } = vnode.attrs;
    const onOwnProfile = account.chain === app.user.activeAccount?.chain?.id
      && account.address === app.user.activeAccount?.address;
    console.log(vnode.attrs);

    const joinCommunity = () => {
      vnode.state.loading = true;
      const addressInfo = app.user.addresses
        .find((a) => a.address === account.address && a.chain === account.chain.id);
      app.user.createRole({
        address: addressInfo,
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
      }).then(() => {
        vnode.state.loading = false;
        m.redraw();
        notifySuccess(`Joined with ${formatAddressShort(addressInfo.address, addressInfo.chain)}`);
        setActiveAccount(account);
      }).catch((err: any) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(err.responseJSON.error);
      });
    };

    return m('.ProfileHeader', [
      m('.cover'),
      m('.bio-main', [
        m('.bio-left', [ // TODO: Rename class to non-bio to avoid confusion with Bio component
          m('.avatar', account.profile?.getAvatar(90)),
        ]),
        m('.bio-right', [
          m('.name-row', [
            m('.User', account.profile ? m(User, { user: account, hideAvatar: true }) : account.address),
          ]),
          m('.info-row', [
            account.profile?.headline && m('span.profile-headline', account.profile.headline),
            m('span.username', formatAddressShort(account.address, account.chain)),
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
        m('.bio-actions', [
          onOwnProfile ? [
            editIdentityAction(account, vnode.state.identity, vnode),
            m(Button, {
              intent: 'primary',
              onclick: () => {
                app.modals.create({
                  modal: EditProfileModal,
                  data: { account, refreshCallback },
                });
              },
              label: 'Edit profile'
            }),
          ] : showJoinCommunityButton
            ? m(Button, {
              intent: 'primary',
              onclick: () => {
                console.log('Joined');
                joinCommunity();
              },
              label: 'Join community'
            })
            : [
            // TODO: actions for others' accounts
            ]
        ]),
      ])
    ]);
  }
};

export default ProfileHeader;
