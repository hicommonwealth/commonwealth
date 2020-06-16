import 'pages/notifications.scss';

import m from 'mithril';

import app from 'state';
import { NotificationSubscription, Notification, OffchainComment } from 'models';
import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import { NotificationCategories } from 'types';

interface INotificationRow {
  notification: Notification;
}

const NotificationRow: m.Component<INotificationRow> = {
  view: (vnode) => {
    const category = vnode.attrs.notification.subscription.category;
    let comment: OffchainComment<any>;
    let thread;

    if (category === NotificationCategories.NewComment) {
      try {
        const { comment_id } = JSON.parse(vnode.attrs.notification.data);
        comment = app.comments.store.getById(comment_id);
      } catch (e) {
        console.error('failed to fetch comment from notification');
      }
    }
    if (category === NotificationCategories.NewThread) {
      try {
        thread = JSON.parse(vnode.attrs.notification.data).thread_id;
      } catch (e) {
        console.error('failed to parse thread from notification');
      }
    }

    return m('.NotificationRow', {
      key: `notification-${vnode.attrs.notification.id}`,
      class: vnode.attrs.notification.isRead ? '' : 'unread',
    }, [
      m('.notification-icon', [
        m('.notification-icon-inner'),
      ]),
      m('.notification-content', [
        category === NotificationCategories.NewThread ? `New thread #${thread}`
          : category === NotificationCategories.NewComment ? [
            (comment && m(User, { user: [comment.author, comment.authorChain], hideAvatar: true })),
            ' commented'
          ] : 'Unknown notification'
      ]),
      m('.notification-created', vnode.attrs.notification.createdAt.fromNow()),
      m('.notification-read', [
        !vnode.attrs.notification.isRead && m('a.notification-mark-read', {
          onclick: (e) => {
            e.preventDefault();
            app.login.notifications.markAsRead([vnode.attrs.notification]).then(() => m.redraw());
          }
        }, 'Mark read'),
      ]),
    ]);
  }
};

const Notifications = {
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      return m('div', 'Must be logged in to view notifications.');
    }
    const subscriptions = app.login.notifications.subscriptions.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const notifications = app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const newCommunitySubscription = app.login.notifications.subscriptions
      .find((v) => v.category === NotificationCategories.NewCommunity);
    const chainOrCommunitySubscription = app.vm.activeAccount
      && app.vm.activeAccount.chain
      && app.login.notifications.subscriptions
        .find((v) => v.category === NotificationCategories.NewThread && v.objectId === app.vm.activeAccount.chain.id);
    return m('.Notifications', [
      m('.row', [
        // notifications
        m('.col-xs-9', [
          m('.forum-container', [
            m('h3', 'Notifications'),
            m('button.formular-button-primary', {
              onclick: (e) => {
                e.preventDefault();
                app.login.notifications.refresh().then(() => m.redraw());
              }
            }, 'Refresh'),
            m('button.formular-button-primary', {
              onclick: (e) => {
                e.preventDefault();
                app.login.notifications.markAsRead(notifications).then(() => m.redraw());
              }
            }, 'Mark all as read'),
            m('button.formular-button-primary', {
              onclick: (e) => {
                e.preventDefault();
                app.login.notifications.clearAllRead().then(() => m.redraw());
              }
            }, 'Clear all read'),
            notifications.map((notification) => m(NotificationRow, { notification })),
          ]),
        ]),
      ]),
    ]);
  }
};

const NotificationsPage = {
  view: (vnode) => {
    return m(Sublayout, {
      class: 'NotificationsPage',
    }, [
      m(Notifications)
    ]);
  }
};

export default NotificationsPage;
