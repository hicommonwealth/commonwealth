/* eslint-disable @typescript-eslint/ban-types */

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type { Account } from 'models';
import type { Component } from 'mithrilInterop';
import { render, redraw } from 'mithrilInterop';
import { setActiveAccount } from '../../../controllers/app/login';
import app from '../../../state';
import { CWButton } from '../../components/component_kit/cw_button';
import { MarkdownFormattedText } from '../../components/quill/markdown_formatted_text';
import { User } from '../../components/user/user';
import { EditProfileModal } from '../../modals/edit_profile_modal';
export interface IProfileHeaderAttrs {
  account: Account;
  refreshCallback: Function;
  onLinkedProfile: boolean;
  onOwnProfile: boolean;
}

export interface IProfileHeaderState {
  copied: boolean;
  loading: boolean;
  showProfileRight: boolean;
}

const ProfileBio: Component<IProfileHeaderAttrs, IProfileHeaderState> = {
  oninit: (vnode) => {
    vnode.state.showProfileRight = false;
  },
  view: (vnode) => {
    const { account, refreshCallback, onOwnProfile, onLinkedProfile } =
      vnode.attrs;
    const showJoinCommunityButton = !onOwnProfile;

    window.addEventListener(
      'scroll',
      () => {
        if (window.scrollY > 142 && vnode.state.showProfileRight === false) {
          vnode.state.showProfileRight = true;
          redraw();
        } else if (
          window.scrollY < 142 &&
          vnode.state.showProfileRight === true
        ) {
          vnode.state.showProfileRight = false;
          redraw();
        }
      },
      { passive: true }
    );

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

    return render('.ProfileBio', [
      render(
        `.ProfileHeader${
          vnode.state.showProfileRight ? '.show-profile' : '.hide-profile'
        }`,
        [
          render('.bio-main', [
            account.profile &&
              render('.bio-left', [
                // TODO: Rename class to non-bio to avoid confusion with Bio component
                account.profile?.getAvatar(90),
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
              render('.address-block-right', [
                render(
                  '.address',
                  `${account.address.slice(0, 6)}...${account.address.slice(
                    account.address.length - 6
                  )}`
                ),
                render('img', {
                  src: !account.ghostAddress
                    ? '/static/img/copy_default.svg'
                    : '/static/img/ghost.svg',
                  alt: '',
                  width: '20px',

                  class: !account.ghostAddress ? 'cursor-pointer' : '',
                  onClick: () => {
                    if (!account.ghostAddress) {
                      window.navigator.clipboard
                        .writeText(account.address)
                        .then(() =>
                          notifySuccess('Copied address to clipboard')
                        );
                    }
                  },
                }),
              ]),
            ]),
          ]),
        ]
      ),
      render('.bio-actions-right', [
        onOwnProfile
          ? [
              render(CWButton, {
                onClick: () => {
                  // @REACT @TODO: Re-add EditProfileModal using new pattern
                  return null;
                },
                label: 'Edit',
              }),
            ]
          : showJoinCommunityButton && app.activeChainId()
          ? render(CWButton, {
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
            })
          : [
              // TODO: actions for others' accounts
            ],
      ]),
      render(
        `.address-block-right${
          vnode.state.showProfileRight ? '.hide-address' : '.show-address'
        }`,
        [
          render(
            '.address',
            `${account.address.slice(0, 6)}...${account.address.slice(
              account.address.length - 6
            )}`
          ),
          render('img', {
            src: !account.ghostAddress
              ? '/static/img/copy_default.svg'
              : '/static/img/ghost.svg',
            alt: '',
            width: '20px',
            class: !account.ghostAddress ? 'cursor-pointer' : '',
            onClick: () => {
              if (!account.ghostAddress) {
                window.navigator.clipboard
                  .writeText(account.address)
                  .then(() => notifySuccess('Copied address to clipboard'));
              }
            },
          }),
        ]
      ),
      account.ghostAddress
        ? render(
            'div',
            {
              style: 'font-style: italic; font-size: 12px;',
            },
            `
      this user was imported from discourse and has a ghost address, if this is your username, login with
      the same email,
      and link an address to claim your username, please note this address will be linked to previous
      post history! Choose wisely!
      `
          )
        : [],
      render('.header', 'Bio'),
      account.profile && account.profile.bio
        ? render('p', [
            render(MarkdownFormattedText, { doc: account.profile.bio }),
          ])
        : render('.no-items', [
            account.profile && account.profile.name
              ? account.profile.name
              : 'This account',
            " hasn't created a bio",
          ]),
    ]);
  },
};

export default ProfileBio;
