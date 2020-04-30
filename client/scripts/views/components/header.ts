import 'components/header.scss';

import m from 'mithril';
import app from 'state';
import Infinite from 'mithril-infinite';
import { Button, Icons, PopoverMenu, ListItem } from 'construct-ui';

import User from 'views/components/widgets/user';
import LoginModal from 'views/modals/login_modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';

import NewProposalButton from 'views/components/new_proposal_button';
import SubscriptionButton from 'views/components/sidebar/subscription_button';
import NotificationRow from 'views/components/sidebar/notification_row';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';

const Header: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain && !app.community) return; // TODO

    // user menu
    const notifications = app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    // TODO: display number of unread notifications

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
          size: 'sm'
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
        size: 'sm',
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
      // logged out state
      !app.isLoggedIn() && m(Button, {
        class: 'login-selector',
        intent: 'primary',
        iconLeft: Icons.USER,
        size: 'sm',
        label: 'Log in',
        onclick: () => app.modals.create({ modal: LoginModal }),
      }),
      // logged in, no address state
      app.isLoggedIn() && !app.vm.activeAccount && m(Button, {
        class: 'login-selector',
        intent: 'none',
        iconLeft: Icons.USER_PLUS,
        size: 'sm',
        label: `Link new ${(app.chain?.chain?.denom) || ''} address`,
        onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
      }),
      // logged in, address selected state
      app.isLoggedIn() && app.vm.activeAccount && m(Button, {
        class: 'login-selector',
        intent: 'none',
        size: 'sm',
        onclick: (e) => m.route.set(`/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`),
        label: m('.login-selector-user', [
          m(User, { user: app.vm.activeAccount, avatarOnly: true, avatarSize: 28, linkify: true }),
          m('.user-info', [
            m(User, { user: app.vm.activeAccount, hideAvatar: true, hideIdentityIcon: true }),
            m('.user-address', app.vm.activeAccount.chain.id === 'near'
              ? `@${app.vm.activeAccount.address}`
              : `${app.vm.activeAccount.address.slice(0, 6)}...`)
          ])
        ]),
      }),
    ]);
  }
};

export default Header;
