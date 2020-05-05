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
import SubscriptionButton from 'views/components/sidebar/subscription_button';
import NotificationRow from 'views/components/sidebar/notification_row';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';

const Header: m.Component<{}> = {
  view: (vnode) => {
    // user menu
    const notifications = app.login.notifications
      ? app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix()) : [];
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;

    return m('.Header', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'}`
    }, [
      m('.placeholder'),
      // new proposal
      m(NewProposalButton, { fluid: false }),
      // notifications menu
      app.isLoggedIn() && (app.community || app.chain)
        && m(SubscriptionButton),
      app.isLoggedIn() && m(PopoverMenu, {
        transitionDuration: 0,
        hoverCloseDelay: 0,
        trigger: m(Button, {
          iconLeft: Icons.BELL,
        }),
        position: 'bottom-end',
        closeOnContentClick: true,
        menuAttrs: {
          align: 'left',
        },
        class: 'notification-menu',
        content: m('.notification-list', [
          notifications.length > 0
            ? m(Infinite, {
              maxPages: 8,
              pageData: () => notifications,
              item: (data, opts, index) => m(NotificationRow, { notification: data }),
            })
            : m('li.no-notifications', 'No Notifications'),
        ]),
      }),
      // invites menu
      app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, {
        iconLeft: Icons.MAIL,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
      // logged out state
      !app.isLoggedIn() && m(Button, {
        class: 'login-selector',
        intent: 'primary',
        iconLeft: Icons.USER,
        label: 'Log in',
        onclick: () => app.modals.create({ modal: LoginModal }),
      }),
      // logged in, no address state
      app.isLoggedIn() && !app.vm.activeAccount && m(PopoverMenu, {
        closeOnContentClick: true,
        transitionDuration: 0,
        hoverCloseDelay: 0,
        trigger: m(Button, {
          class: 'login-selector',
          intent: 'none',
          iconLeft: Icons.USER_PLUS,
          label: `Link new ${(app.chain?.chain?.denom) || ''} address`,
          onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
        }),
        content: [
          // TODO
          m(MenuItem, {
            label: 'TODO',
          }),
        ],
      }),
      // logged in, address selected state
      app.isLoggedIn() && app.vm.activeAccount && m(PopoverMenu, {
        closeOnContentClick: true,
        transitionDuration: 0,
        hoverCloseDelay: 0,
        trigger: m(Button, {
          class: 'login-selector',
          intent: 'none',
          label: m('.login-selector-user', [
            m(User, { user: app.vm.activeAccount, hideIdentityIcon: true }),
            m('.user-address', app.vm.activeAccount.chain.id === 'near'
              ? `@${app.vm.activeAccount.address}`
              : `${app.vm.activeAccount.address.slice(0, 6)}...`)
          ]),
        }),
        content: [
          m.route.get() !== `/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}` && [
            m(MenuItem, {
              label: 'Go to profile',
              onclick: (e) => m.route.set(`/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`),
              iconLeft: Icons.USER,
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
