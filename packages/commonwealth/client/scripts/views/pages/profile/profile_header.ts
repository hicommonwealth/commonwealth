/* eslint-disable @typescript-eslint/ban-types */

import { Button } from 'construct-ui';

import { initChain } from 'app';
import app from 'state';
import { Account } from 'models';
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

import SubstrateIdentity from 'controllers/chain/substrate/identity';
import User from 'views/components/widgets/user';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setActiveAccount } from 'controllers/app/login';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { alertModalWithText } from '../../modals/alert_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { BanUserModal } from '../../modals/ban_user_modal';

const editIdentityAction = (
  account: Account,
  currentIdentity: SubstrateIdentity,
  vnode
) => {
  const chainObj = app.config.chains.getById(account.chain.id);
  if (!chainObj) return;

  // TODO: look up the chainObj's chain base
  return (
    (account.chain.id.indexOf('edgeware') !== -1 ||
      account.chain.id.indexOf('kusama') !== -1) &&
    render(Button, {
      intent: 'primary',
      // wait for info to load before making it clickable
      disabled: vnode.state.chainLoading,
      rounded: true,
      onclick: async () => {
        if (app.activeChainId() !== chainObj.id) {
          let confirmed = false;
          const msg = `Must switch to ${chainObj.name} to set on-chain identity. Continue?`;
          confirmed = await confirmationModalWithText(msg)();
          if (confirmed) {
            setRoute(`/${chainObj.id}/account/${account.address}`, {
              setIdentity: true,
            });
          }
        } else if (!app.chain?.loaded) {
          vnode.state.chainLoading = true;
          initChain()
            .then(() => {
              vnode.state.chainLoading = false;
              app.modals.create({
                modal: EditIdentityModal,
                data: { account, currentIdentity },
              });
            })
            .catch((err) => {
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
      label: currentIdentity?.exists ? 'Edit identity' : 'Set identity',
    })
  );
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

const ProfileHeader: Component<IProfileHeaderAttrs, IProfileHeaderState> = {
  view: (vnode) => {
    const { account, refreshCallback, onOwnProfile, onLinkedProfile } =
      vnode.attrs;
    const showJoinCommunityButton = vnode.attrs.setIdentity && !onOwnProfile;
    const isClaimable = !account || !account.profile || account.profile.isEmpty;

    // For Banning
    const loggedInUserIsAdmin =
      app.user.isSiteAdmin ||
      app.roles.isAdminOfEntity({
        chain: app.activeChainId(),
      });

    const joinCommunity = async () => {
      if (!app.activeChainId() || onOwnProfile) return;
      vnode.state.loading = true;
      const addressInfo = app.user.addresses.find(
        (a) =>
          a.address === account.address && a.chain.id === app.activeChainId()
      );
      try {
        await app.roles.createRole({
          address: addressInfo,
          chain: app.activeChainId(),
        });
        vnode.state.loading = false;
        await setActiveAccount(account);
        redraw();
        notifySuccess('Joined community');
      } catch (err) {
        vnode.state.loading = false;
        notifyError('Failed to join community');
      }
    };

    return render('.ProfileHeader', [
      render('.bio-main', [
        render('.bio-left', [
          // TODO: Rename class to non-bio to avoid confusion with Bio component
          account.profile && account.profile?.getAvatar(90),
        ]),
        render('.bio-right', [
          render('.name-row', [
            render(
              '.User',
              account.profile
                ? render(User, { user: account, hideAvatar: true, showRole: true })
                : account.address
            ),
          ]),
          render('.address-block-left', [
            render(
              '.address',
              `${account.address.slice(0, 6)}...${account.address.slice(
                account.address.length - 6
              )}`
            ),
            render('img', {
              src: '/static/img/copy_default.svg',
              alt: '',
              class: 'cursor-pointer',
              onclick: (e) => {
                window.navigator.clipboard
                  .writeText(account.address)
                  .then(() => notifySuccess('Copied address to clipboard'));
              },
            }),
          ]),
          render('.info-row', [
            account.profile?.headline &&
              render('span.profile-headline', account.profile.headline),
            render('.space'),
            // isClaimable &&
            //   render(LoginWithWalletDropdown, {
            //     prepopulateAddress: account.address,
            //     loggingInWithAddress: !app.isLoggedIn(),
            //     joiningChain: app.activeChainId(),
            //     label: 'Claim address',
            //   }),
          ]),
        ]),
      ]),
      render('.bio-actions', [
        account.profile &&
          account.profile.bio &&
          render(CWButton, {
            onclick: () => {
              alertModalWithText(account.profile.bio, 'Close')();
            },
            label: 'View Bio',
          }),
        // If Admin Allow Banning
        loggedInUserIsAdmin &&
          render('.ban-wrapper', [
            render(CWButton, {
              onclick: () => {
                app.modals.create({
                  modal: BanUserModal,
                  data: { profile: account.profile },
                });
              },
              label: 'Ban User',
              buttonType: 'primary-red',
            }),
          ]),
        render('', [
          onOwnProfile
            ? showJoinCommunityButton && app.activeChainId()
            : render(Button, {
                intent: 'primary',
                rounded: true,
                onclick: async () => {
                  if (onLinkedProfile) {
                    vnode.state.loading = true;
                    try {
                      await setActiveAccount(account);
                      redraw();
                    } catch (e) {
                      vnode.state.loading = false;
                      notifyError(e);
                    }
                  } else {
                    try {
                      await joinCommunity();
                      redraw();
                    } catch (e) {
                      vnode.state.loading = false;
                      notifyError(e);
                    }
                  }
                },
                label: onLinkedProfile ? 'Switch to address' : 'Join community',
              }),
        ]),
      ]),
    ]);
  },
};

export default ProfileHeader;
