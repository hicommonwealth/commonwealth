import 'pages/home.scss';

import $ from 'jquery';
import { default as m } from 'mithril';
import mixpanel from 'mixpanel-browser';
import Infinite from 'mithril-infinite';
import { Button, Icon, Icons, PopoverMenu, List, MenuItem, MenuDivider } from 'construct-ui';
import app from 'state';

import HomepageCommunities from 'views/components/homepage_communities';
import NotificationRow from 'views/components/sidebar/notification_row';
import { initAppState } from '../../app';
import { notifySuccess } from '../../controllers/app/notifications';
import User from '../components/widgets/user';
import LoginModal from '../modals/login_modal';
import FeedbackModal from '../modals/feedback_modal';

const HomePage : m.Component<{}, {}> = {
  view: (vnode) => {
    const notifications = app.login.notifications
      ? app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix()) : [];
    const accountURI = app?.vm?.activeAccount?.chain?.id
      ? `/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`
      : null;
    return m('.HomePage', [
      m('.home-content', [
        m('.container', [
          m('.pseudo-header', [
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
                      item: (data) => {
                        return m(NotificationRow, {
                          notification: data
                        });
                      },
                    })
                    : m('li.no-notifications', 'No Notifications'),
                ]),
              }),
              // logged in: select address
              app.isLoggedIn() && m(PopoverMenu, {
                closeOnContentClick: true,
                transitionDuration: 0,
                hoverCloseDelay: 0,
                position: 'bottom-end',
                trigger: m(Button, {
                  class: app.vm.activeAccount
                    ? 'login-selector'
                    : 'login-selector cui-button-icon',
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
                  && m.route.get() !== accountURI
                  && [
                    m(MenuItem, {
                      label: 'Go to profile',
                      iconLeft: Icons.USER,
                      onclick: (e) => {
                        m.route.set(accountURI);
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
          ]),
          m(HomepageCommunities),
        ]),
      ]),
    ]);
  }
};

export default HomePage;
