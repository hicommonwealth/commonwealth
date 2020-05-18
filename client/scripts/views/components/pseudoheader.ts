import 'pages/pseudoheader.scss';

import $ from 'jquery';
import { default as m } from 'mithril';
import app from 'state';

import mixpanel from 'mixpanel-browser';
import Infinite from 'mithril-infinite';
import { Button, Icon, Icons, PopoverMenu, MenuItem, MenuDivider } from 'construct-ui';

import { HeaderNotificationRow } from './sidebar/notification_row';
import { initAppState } from '../../app';
import { notifySuccess } from '../../controllers/app/notifications';
import User from './widgets/user';
import LoginModal from '../modals/login_modal';
import FeedbackModal from '../modals/feedback_modal';
import NotificationsDrowdownMenu from './notifications_dropdown_menu';


const PseudoHeader : m.Component<{}, {}> = {
  view: (vnode: m.VnodeDOM<{}, {}>) => {
    const notifications = app.login.notifications
      ? app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix()) : [];
    const accountURI = app?.vm?.activeAccount?.chain?.id
      ? `/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`
      : null;

    return m('.PseudoHeader', [
      m('.left-pseudo-header', [
        m('h2.lead-title', 'On-chain communities'),
        m('p.lead-description', [
          'Forums, profiles, and voting for decentralized organizations',
        ]),
      ]),
      m('.right-pseudo-header', [
        // logged out
        !app.isLoggedIn() && m(Button, {
          class: 'login-selector',
          intent: 'primary',
          iconLeft: Icons.USER,
          label: 'Log in',
          onclick: () => app.modals.create({ modal: LoginModal }),
        }),
        // logged in: notifications menu
        app.isLoggedIn() && m(NotificationsDrowdownMenu),
        // logged in: select address
        app.isLoggedIn() && m(PopoverMenu, {
          closeOnContentClick: true,
          transitionDuration: 0,
          hoverCloseDelay: 0,
          position: 'bottom-end',
          trigger: m(Button, {
            class: 'login-selector cui-button-icon',
            intent: 'none',
            label: m(Icon, { name: Icons.CHEVRON_DOWN }),
          }),
          content: [
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
      ]),
    ]);
  }
};

export default PseudoHeader;
