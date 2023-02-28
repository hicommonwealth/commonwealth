/* eslint-disable @typescript-eslint/ban-types */
import { setActiveAccount } from 'controllers/app/login';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

import type { Component } from 'mithrilInterop';
import { render, redraw } from 'mithrilInterop';

import app from 'state';
import { User } from 'views/components/user/user';
import { CWButton } from '../../components/component_kit/cw_button';
import { BanUserModal } from '../../modals/ban_user_modal';

export interface IProfileHeaderAttrs {
  account;
  refreshCallback: Function;
  onLinkedProfile: boolean;
  onOwnProfile: boolean;
}

export interface IProfileHeaderState {
  copied: boolean;
  loading: boolean;
}

const ProfileHeader: Component<IProfileHeaderAttrs, IProfileHeaderState> = {
  view: (vnode) => {
    const { account, onOwnProfile, onLinkedProfile } = vnode.attrs;
    const showJoinCommunityButton = !onOwnProfile;

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
                ? render(User, {
                    user: account,
                    hideAvatar: true,
                    showRole: true,
                  })
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
              onClick: () => {
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
        // If Admin Allow Banning
        loggedInUserIsAdmin &&
          render(CWButton, {
            onClick: () => {
              // @REACT @TODO: Re-add BanUserModal using new pattern
              return null;
            },
            label: 'Ban User',
            buttonType: 'primary-red',
          }),
        render('', [
          onOwnProfile
            ? showJoinCommunityButton && app.activeChainId()
            : render(CWButton, {
                onClick: async () => {
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
