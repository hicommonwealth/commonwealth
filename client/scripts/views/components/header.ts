import 'components/header.scss';

import m from 'mithril';
import app from 'state';
import Infinite from 'mithril-infinite';
import { Button, Icons, PopoverMenu } from 'construct-ui';

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
    ]);
  }
};

export default Header;
