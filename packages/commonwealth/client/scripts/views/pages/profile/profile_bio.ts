/* eslint-disable @typescript-eslint/ban-types */
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import m from 'mithril';
import { initChain } from 'helpers/chain';
import { setActiveAccount } from '../../../controllers/app/login';
import app from '../../../state';
import { CWButton } from '../../components/component_kit/cw_button';
import { MarkdownFormattedText } from '../../components/quill/markdown_formatted_text';
import User from '../../components/widgets/user';
import { EditProfileModal } from '../../modals/edit_profile_modal';
import AddressAccount from "models/AddressAccount";

export interface IProfileHeaderAttrs {
  account: AddressAccount;
  refreshCallback: Function;
  onLinkedProfile: boolean;
  onOwnProfile: boolean;
}

export interface IProfileHeaderState {
  copied: boolean;
  loading: boolean;
  showProfileRight: boolean;
}

const ProfileBio: m.Component<IProfileHeaderAttrs, IProfileHeaderState> = {
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
          m.redraw();
        } else if (
          window.scrollY < 142 &&
          vnode.state.showProfileRight === true
        ) {
          vnode.state.showProfileRight = false;
          m.redraw();
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
        m.redraw();
        notifySuccess('Joined community');
      } catch (err) {
        vnode.state.loading = false;
        notifyError('Failed to join community');
      }
    };

    return m('.ProfileBio', [
      m(
        `.ProfileHeader${
          vnode.state.showProfileRight ? '.show-profile' : '.hide-profile'
        }`,
        [
          m('.bio-main', [
            account.profile &&
              m('.bio-left', [
                // TODO: Rename class to non-bio to avoid confusion with Bio component
                account.profile?.getAvatar(90),
              ]),
            m('.bio-right', [
              m('.name-row', [
                m(
                  '.User',
                  account.profile
                    ? m(User, {
                        user: account,
                        hideAvatar: true,
                        showRole: true,
                      })
                    : account.address
                ),
              ]),
              m('.address-block-right', [
                m(
                  '.address',
                  `${account.address.slice(0, 6)}...${account.address.slice(
                    account.address.length - 6
                  )}`
                ),
                m('img', {
                  src: !account.ghostAddress
                    ? '/static/img/copy_default.svg'
                    : '/static/img/ghost.svg',
                  alt: '',
                  width: '20px',

                  class: !account.ghostAddress ? 'cursor-pointer' : '',
                  onclick: () => {
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
      m('.bio-actions-right', [
        onOwnProfile
          ? [
              m(CWButton, {
                onclick: () => {
                  app.modals.create({
                    modal: EditProfileModal,
                    data: { account, refreshCallback },
                  });
                },
                label: 'Edit',
              }),
            ]
          : showJoinCommunityButton && app.activeChainId()
          ? m(CWButton, {
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
              label: onLinkedProfile ? 'Switch to address' : 'Join community',
            })
          : [
              // TODO: actions for others' accounts
            ],
      ]),
      m(
        `.address-block-right${
          vnode.state.showProfileRight ? '.hide-address' : '.show-address'
        }`,
        [
          m(
            '.address',
            `${account.address.slice(0, 6)}...${account.address.slice(
              account.address.length - 6
            )}`
          ),
          m('img', {
            src: !account.ghostAddress
              ? '/static/img/copy_default.svg'
              : '/static/img/ghost.svg',
            alt: '',
            width: '20px',
            class: !account.ghostAddress ? 'cursor-pointer' : '',
            onclick: () => {
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
        ? m(
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
      m('.header', 'Bio'),
      account.profile && account.profile.bio
        ? m('p', [m(MarkdownFormattedText, { doc: account.profile.bio })])
        : m('.no-items', [
            account.profile && account.profile.name
              ? account.profile.name
              : 'This account',
            " hasn't created a bio",
          ]),
    ]);
  },
};

export default ProfileBio;
