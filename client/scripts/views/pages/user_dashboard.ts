import 'pages/user_dashboard.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { TabItem, Tabs, Icon, Icons, Spinner } from 'construct-ui';

import app from 'state';
import { DashboardActivityNotification } from 'models';
import UserDashboardRow from 'views/components/user_dashboard_row';
import Sublayout from 'views/sublayout';
import DashboardExplorePreview from '../components/dashboard_explore_preview';

const fetchActivity = async (request: string) => {
  const activity = await $.post(`${app.serverUrl()}/viewActivity`, {
    request,
    jwt: app.user.jwt,
  });
  return activity;
};

const notificationsRemaining = (contentLength, count) => {
  return contentLength >= 10 && count < contentLength;
};

enum DashboardViews {
  FY = 'For You',
  Global = 'Global',
  Chain = 'Chain',
}

const UserDashboard: m.Component<
  {},
  {
    fyCount: number;
    globalCount: number;
    chainEventCount: number;
    activeTab: DashboardViews;
    loadingData: boolean;
    onscroll;
    fyNotifications: DashboardActivityNotification[];
    globalNotifications: DashboardActivityNotification[];
    chainEvents: DashboardActivityNotification[];
  }
> = {
  oninit: (vnode) => {
    vnode.state.fyCount = 10;
    vnode.state.globalCount = 10;
    vnode.state.chainEventCount = 10;
    vnode.state.loadingData = false;
    vnode.state.fyNotifications = [];
    vnode.state.globalNotifications = [];
    vnode.state.chainEvents = [];
  },
  view: (vnode) => {
    const {
      activeTab,
      fyNotifications,
      globalNotifications,
      chainEvents,
      loadingData,
    } = vnode.state;

    // Helper to load activity conditional on the selected tab
    const handleToggle = (tab: DashboardViews) => {
      vnode.state.loadingData = false;
      if (tab === DashboardViews.FY) {
        if (fyNotifications.length === 0) vnode.state.loadingData = true;
        fetchActivity('forYou').then((activity) => {
          vnode.state.fyNotifications = activity.result
            .map((notification) =>
              DashboardActivityNotification.fromJSON(notification)
            )
            .reverse();
          vnode.state.loadingData = false;
          m.redraw();
        });
      } else if (tab === DashboardViews.Global) {
        if (globalNotifications.length === 0) vnode.state.loadingData = true;
        fetchActivity('global').then((activity) => {
          vnode.state.globalNotifications = activity.result.map(
            (notification) =>
              DashboardActivityNotification.fromJSON(notification)
          );
          vnode.state.loadingData = false;
          m.redraw();
        });
      } else if (tab === DashboardViews.Chain) {
        if (chainEvents.length === 0) vnode.state.loadingData = true;
        fetchActivity('chainEvents').then((activity) => {
          vnode.state.chainEvents = activity.result.map((notification) =>
            DashboardActivityNotification.fromJSON(notification)
          );
          vnode.state.loadingData = false;
          m.redraw();
        });
      }
      vnode.state.activeTab = tab;
    };

    // Load activity
    if (!vnode.state.activeTab) {
      handleToggle(DashboardViews.FY);
    }

    // Scroll
    vnode.state.onscroll = _.debounce(async () => {
      if (vnode.state.activeTab === DashboardViews.FY) {
        if (
          !notificationsRemaining(fyNotifications.length, vnode.state.fyCount)
        )
          return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          vnode.state.fyCount += 10;
          m.redraw();
        }
      } else if (vnode.state.activeTab === DashboardViews.Global) {
        if (
          !notificationsRemaining(
            globalNotifications.length,
            vnode.state.globalCount
          )
        )
          return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          vnode.state.globalCount += 10;
          m.redraw();
        }
      } else {
        if (
          !notificationsRemaining(
            chainEvents.length,
            vnode.state.chainEventCount
          )
        )
          return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          vnode.state.chainEventCount += 10;
          m.redraw();
        }
      }
    }, 400);

    $(window).on('scroll', vnode.state.onscroll);

    return m(
      Sublayout,
      {
        class: 'UserDashboard',
      },
      [
        m('.dashboard-wrapper', [
          m('.dashboard-header', [
            m('.title', [
              'Activity',
              m(
                '.communities-link',
                {
                  class: 'link',
                  onclick: () => {
                    m.route.set('/communities');
                    m.redraw();
                  },
                },
                [
                  'View more communities',
                  m(Icon, {
                    name: Icons.EXTERNAL_LINK,
                  }),
                ]
              ),
            ]),
            m(
              Tabs,
              {
                align: 'left',
                bordered: false,
                fluid: true,
              },
              [
                m(TabItem, {
                  label: DashboardViews.FY,
                  active: activeTab === DashboardViews.FY,
                  onclick: () => {
                    handleToggle(DashboardViews.FY);
                    m.redraw();
                  },
                }),
                m(TabItem, {
                  label: DashboardViews.Global,
                  active: activeTab === DashboardViews.Global,
                  onclick: () => {
                    handleToggle(DashboardViews.Global);
                    m.redraw();
                  },
                }),
                m(TabItem, {
                  label: DashboardViews.Chain,
                  active: activeTab === DashboardViews.Chain,
                  onclick: () => {
                    handleToggle(DashboardViews.Chain);
                    m.redraw();
                  },
                }),
              ]
            ),
            loadingData &&
              m('.dashboard-row-wrap', [
                m('.Spinner', [m(Spinner, { active: true })]),
              ]),
            !loadingData &&
              m('.dashboard-row-wrap', [
                activeTab === DashboardViews.FY && [
                  fyNotifications && fyNotifications.length > 0
                    ? [
                        fyNotifications
                          .slice(0, vnode.state.fyCount)
                          .map((data) => {
                            return m(UserDashboardRow, {
                              notification: data,
                              onListPage: true,
                            });
                          }),
                        notificationsRemaining(
                          fyNotifications.length,
                          vnode.state.fyCount
                        )
                          ? m('.Spinner', [m(Spinner, { active: true })])
                          : '',
                      ]
                    : m(
                        '.no-notifications',
                        'Join some communities to see Activity!'
                      ),
                ],
                activeTab === DashboardViews.Global && [
                  globalNotifications && globalNotifications.length > 0
                    ? [
                        globalNotifications
                          .slice(0, vnode.state.globalCount)
                          .map((data) => {
                            return m(UserDashboardRow, {
                              notification: data,
                              onListPage: true,
                            });
                          }),
                        notificationsRemaining(
                          globalNotifications.length,
                          vnode.state.globalCount
                        )
                          ? m('.Spinner', [m(Spinner, { active: true })])
                          : '',
                      ]
                    : m('.no-notifications', 'No Activity'),
                ],
                activeTab === DashboardViews.Chain && [
                  chainEvents && chainEvents.length > 0
                    ? [
                        chainEvents
                          .slice(0, vnode.state.chainEventCount)
                          .map((data) => {
                            return m(UserDashboardRow, {
                              notification: data,
                              onListPage: true,
                            });
                          }),
                        notificationsRemaining(
                          chainEvents.length,
                          vnode.state.chainEventCount
                        )
                          ? m('.Spinner', [m(Spinner, { active: true })])
                          : '',
                      ]
                    : m(
                        '.no-notifications',
                        'Join some communities that have governance to see Chain Events!'
                      ),
                ],
              ]),
          ]),
          m(DashboardExplorePreview),
        ]),
      ]
    );
  },
};

export default UserDashboard;
