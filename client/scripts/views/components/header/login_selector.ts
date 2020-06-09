import 'components/header/login_selector.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import { Button, Icon, Icons, List, ListItem, MenuItem, MenuDivider, PopoverMenu } from 'construct-ui';

import app from 'state';
import { initAppState } from 'app';
import { notifySuccess } from 'controllers/app/notifications';

import User from 'views/components/widgets/user';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import LoginModal from 'views/modals/login_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import EditProfileModal from 'views/modals/edit_profile_modal';
import FeedbackModal from 'views/modals/feedback_modal';
import SelectAddressModal from 'views/modals/select_address_modal';

const LoginSelector = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return m('.LoginSelector', [
      m('.login-selector-user', [
        m(Button, {
          intent: 'primary',
          iconLeft: Icons.USER,
          size: 'sm',
          fluid: true,
          label: 'Log in',
          onclick: () => app.modals.create({ modal: LoginModal }),
        }),
      ]),
    ]);

    return m('.LoginSelector', {
      class: (app.chain || app.community) ? '' : 'no-community',
    }, [
      (app.chain || app.community) && m('.login-selector-left', app.vm.activeAccount
        // if address selected
        ? [
          m(User, { user: app.vm.activeAccount, avatarOnly: true, avatarSize: 28, linkify: true }),
          m('.login-selector-user', [
            m('.user-info', [
              m(User, { user: app.vm.activeAccount, hideAvatar: true, hideIdentityIcon: true }),
              m('.user-address', app.vm.activeAccount.chain.id === 'near'
                ? `@${app.vm.activeAccount.address}`
                : `${app.vm.activeAccount.address.slice(0, 6)}...`)
            ])
          ]),
        ]
        // if no address is selected
        : app.login.activeAddresses.length === 0 ? m(Button, {
          intent: 'none',
          iconLeft: Icons.USER_PLUS,
          size: 'sm',
          fluid: true,
          label: 'Link new address',
          onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
        })
        // if addresses are available, but none is selected
        : m(Button, {
          label: 'Select an address',
          fluid: true,
          size: 'sm',
          onclick: () => app.modals.create({ modal: SelectAddressModal }),
        })),
      m('.login-selector-right', [
        // logged in
        app.isLoggedIn() && m(PopoverMenu, {
          closeOnContentClick: true,
          transitionDuration: 0,
          hoverCloseDelay: 0,
          position: 'top-end',
          trigger: m(Button, {
            class: app.vm.activeAccount ? 'address-menu' : 'address-menu cui-button-icon',
            intent: 'none',
            size: 'sm',
            fluid: true,
            label: m(Icon, { name: Icons.SETTINGS }),
          }),
          content: [
            m(MenuItem, {
              label: 'Go to profile',
              iconLeft: Icons.USER,
              onclick: (e) => {
                m.route.set(`/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`);
              },
              disabled: !(
                app.vm.activeAccount
                  && app.vm.activeAccount.chain
                  && m.route.get() !== `/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`)
            }),
            app.vm.activeAccount
              && m(MenuItem, {
                onclick: () => app.modals.create({
                  modal: EditProfileModal,
                  data: app.vm.activeAccount
                }),
                iconLeft: Icons.EDIT,
                label: 'Edit Profile'
              }),
            app.chain && m(MenuItem, {
              onclick: async () => app.modals.create({
                modal: EditIdentityModal,
                data: { account: app.vm.activeAccount },
              }),
              iconLeft: Icons.LINK,
              label: 'Set on-chain ID'
            }),
            m(MenuDivider),
            (app.chain || app.community) && m(MenuItem, {
              onclick: async () => app.modals.create({
                modal: SelectAddressModal,
              }),
              iconLeft: Icons.USER,
              label: 'Switch address'
            }),
            m(MenuItem, {
              onclick: () => m.route.set('/settings'),
              iconLeft: Icons.SETTINGS,
              label: 'Settings'
            }),
            app.login?.isSiteAdmin && app.activeChainId() && m(MenuItem, {
              onclick: () => m.route.set(`/${app.activeChainId()}/admin`),
              iconLeft: Icons.USER,
              label: 'Admin'
            }),
            m(MenuItem, {
              onclick: () => app.modals.create({ modal: FeedbackModal }),
              iconLeft: Icons.SEND,
              label: 'Send feedback',
            }),
            m(MenuItem, {
              onclick: () => {
                $.get(`${app.serverUrl()}/logout`).then(async () => {
                  await initAppState();
                  notifySuccess('Logged out');
                  m.route.set('/');
                  m.redraw();
                }).catch((err) => {
                  // eslint-disable-next-line no-restricted-globals
                  location.reload();
                });
                mixpanel.reset();
              },
              iconLeft: Icons.X_SQUARE,
              label: 'Logout'
            }),
          ]
        }),
      ])
    ]);
  }
};

export default LoginSelector;
