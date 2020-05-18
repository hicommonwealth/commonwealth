import 'components/header.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import Infinite from 'mithril-infinite';
import { Button, Icon, Icons, PopoverMenu, List, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';
import { initAppState } from 'app';

import { notifySuccess } from 'controllers/app/notifications';
import FeedbackModal from 'views/modals/feedback_modal';
import User from 'views/components/widgets/user';
import LoginModal from 'views/modals/login_modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';

import NewProposalButton from 'views/components/new_proposal_button';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import EditProfileModal from 'views/modals/edit_profile_modal';
import NotificationsDrowdownMenu from './notifications_dropdown_menu';
import EditIdentityModal from '../modals/edit_identity_modal';

const Header: m.Component<{}> = {
  view: (vnode) => {
    // user menu

    return m('.Header', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'}`
    }, [
      m('.placeholder'),
      // new proposal
      m(NewProposalButton, { fluid: false }),
      // notifications menu
      app.isLoggedIn() && m(NotificationsDrowdownMenu),
      // invites menu
      app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, {
        iconLeft: Icons.MAIL,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
      // logged out
      !app.isLoggedIn() && m(Button, {
        class: 'login-selector',
        intent: 'primary',
        iconLeft: Icons.USER,
        label: 'Log in',
        onclick: () => app.modals.create({ modal: LoginModal }),
      }),
      // logged in
      app.isLoggedIn() && m(PopoverMenu, {
        closeOnContentClick: true,
        transitionDuration: 0,
        hoverCloseDelay: 0,
        position: 'bottom-end',
        trigger: m(Button, {
          class: app.vm.activeAccount ? 'login-selector' : 'login-selector cui-button-icon',
          intent: 'none',
          label: app.vm.activeAccount
            ? m('.login-selector-user', [
              m(User, { user: app.vm.activeAccount, hideIdentityIcon: true }),
              m('.user-address', app.vm.activeAccount.chain.id === 'near'
                ? `@${app.vm.activeAccount.address}`
                : `${app.vm.activeAccount.address.slice(0, 6)}...`)
            ])
            : m(Icon, { name: Icons.CHEVRON_DOWN }),
        }),
        content: [
          app.vm.activeAccount
            && app.vm.activeAccount.chain
            && m.route.get() !== `/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`
            && [
              m(MenuItem, {
                label: 'Go to profile',
                iconLeft: Icons.USER,
                onclick: (e) => {
                  m.route.set(`/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`);
                },
              }),
              m(MenuDivider),
            ],
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
          app.vm.activeAccount
          && m(MenuItem, {
            onclick: () => app.modals.create({
              modal: EditProfileModal,
              data: app.vm.activeAccount
            }),
            iconLeft: Icons.EDIT,
            label: 'Edit Profile'
          }),
          m(MenuItem, {
            onclick: async () => app.modals.create({
              modal: EditIdentityModal,
              data: { account: app.vm.activeAccount },
            }),
            iconLeft: Icons.LINK,
            label: 'Set on-chain ID'
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
    ]);
  }
};

export default Header;
