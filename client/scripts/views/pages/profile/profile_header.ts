import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Button } from 'construct-ui';
import * as clipboard from 'clipboard-polyfill';

import { initChain } from 'app';
import app from 'state';

import SubstrateIdentity from 'controllers/chain/substrate/identity';
import User from 'views/components/widgets/user';
import EditProfileModal from 'views/modals/edit_profile_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setActiveAccount } from 'controllers/app/login';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import PageLoading from 'views/pages/loading';
import LoginWithWalletDropdown from 'views/components/login_with_wallet_dropdown';
import { formatAddressShort } from '../../../../../shared/utils';
import OnboardingModal from '../../modals/onboarding_modal/index';

const editIdentityAction = (account, currentIdentity: SubstrateIdentity, vnode) => {
  const chainObj = app.config.chains.getById(account.chain);
  if (!chainObj) return;

  // TODO: look up the chainObj's chain base
  return (account.chain.indexOf('edgeware') !== -1 || account.chain.indexOf('kusama') !== -1) && m(Button, {
    intent: 'primary',
    // wait for info to load before making it clickable
    disabled: vnode.state.chainLoading,
    rounded: true,
    onclick: async () => {
      if (app.activeId() !== chainObj.id) {
        let confirmed = false;
        const msg = `Must switch to ${chainObj.name} to set on-chain identity. Continue?`;
        confirmed = await confirmationModalWithText(msg)();
        if (confirmed) {
          m.route.set(`/${chainObj.id}/account/${account.address}`, {
            setIdentity: true
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
    loading: !!vnode.state.chainLoading,
    label: currentIdentity?.exists ? 'Edit identity' : 'Set identity'
  });
};

export interface IProfileHeaderAttrs {
  account;
  setIdentity: boolean;
  refreshCallback: Function;
  onLinkedProfile: boolean;
  onOwnProfile: boolean;
}

export interface IProfileHeaderState {
  identity: SubstrateIdentity | null;
  copied: boolean;
  loading: boolean;
}

const ProfileHeader: m.Component<IProfileHeaderAttrs, IProfileHeaderState> = {
  oninit: (vnode) => {
    const { account } = vnode.attrs;
    const step = m.route.param('step');
    const joiningCommunity = m.route.param('joiningCommunity');
    const joiningChain = m.route.param('joiningChain');
    if (step) {
      app.modals.removeAll();
      app.modals.create({ modal: OnboardingModal, data: { joiningCommunity, joiningChain, address: account.address, step } });
    }
  },
  view: (vnode) => {
    const { account, refreshCallback, onOwnProfile, onLinkedProfile } = vnode.attrs;
    const showJoinCommunityButton = vnode.attrs.setIdentity && !onOwnProfile;
    const isClaimable = !account || !account.profile;

    const joinCommunity = async () => {
      if (!app.activeChainId() || onOwnProfile) return;
      vnode.state.loading = true;
      const addressInfo = app.user.addresses
        .find((a) => a.address === account.address && a.chain === app.activeChainId());
      try {
        await app.user.createRole({
          address: addressInfo,
          chain: app.activeChainId(),
          community: app.activeCommunityId(),
        });
        vnode.state.loading = false;
        await setActiveAccount(account);
        m.redraw();
        notifySuccess('Joined community');
      } catch (err) {
        vnode.state.loading = false;
        notifyError('Failed to join community');
      }
    };

    return m('.ProfileHeader', [
      m('.cover'),
      m('.bio-main', [
        m('.bio-left', [ // TODO: Rename class to non-bio to avoid confusion with Bio component
          m('.avatar', account.profile?.getAvatar(90)),
        ]),
        m('.bio-right', [
          m('.name-row', [
            m('.User', account.profile
              ? m(User, { user: account, hideAvatar: true, showRole: true })
              : account.address),
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
            m('.space'),
          ]),
        ]),
        m('.bio-actions-breakpoint'),
        m('.bio-actions', [
          isClaimable && m(Button, {
            intent: 'primary',
            rounded: true,
            class: '',
            onclick: () => {
              app.modals.create({ modal: OnboardingModal, data: { joiningCommunity: app.activeCommunityId(), joiningChain: app.activeChainId(), address: account.address } });
            },
            label: 'Claim Address'
          }),
          onOwnProfile ? [
            editIdentityAction(account, vnode.state.identity, vnode),
            m(Button, {
              intent: 'primary',
              rounded: true,
              onclick: () => {
                app.modals.create({
                  modal: EditProfileModal,
                  data: { account, refreshCallback },
                });
              },
              label: 'Edit'
            }),
          ] : (showJoinCommunityButton && app.activeChainId())
            ? m(Button, {
              intent: 'primary',
              rounded: true,
              onclick: async () => {
                if (onLinkedProfile) {
                  vnode.state.loading = true;
                  try {
                    await setActiveAccount(account);
                    m.redraw();
                  } catch (e) {
                    vnode.state.loading = false;
                    notifyError(e);
                  }
                } else {
                  try {
                    await joinCommunity();
                    m.redraw();
                  } catch (e) {
                    vnode.state.loading = false;
                    notifyError(e);
                  }
                }
              },
              label: onLinkedProfile ? 'Switch to address' : 'Join community'
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
