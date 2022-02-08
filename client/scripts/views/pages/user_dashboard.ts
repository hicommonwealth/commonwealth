import 'pages/user_dashboard.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import $ from 'jquery';
import { TabItem, Tabs, Tag, Col, Grid, Card, Icon, Icons, Spinner } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import { DashboardActivityNotification, ChainEvent } from 'models';
import { sortNotifications } from 'helpers/notifications';
import UserDashboardRow from 'views/components/user_dashboard_row';
import { ChainIcon } from 'views/components/chain_icon';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import DashboardExplorePreview from '../components/dashboard_explore_preview';
import { LoadingLayout } from '../layout';


const fetchActivity = async (request: string) => {
  const activity = await $.post(`${app.serverUrl()}/viewActivity`, {
    request,
    jwt: app.user.jwt
  });
  return activity;
}

const notificationsRemaining = (contentLength, count) => {
  return (contentLength >= 10 && count < contentLength);
};

export enum DashboardViews {
  FY = 'For You',
  Global = 'Global',
  Chain = 'Chain',
}

/**
 * Important Note:
 * 
 * The User Dashboard is currently displaying content that might be informally labeled "Activity"- comments,
 * reactions, replies, etc. that occur within any community in which the logged in user is a member, regardless
 * of whether they are directly implicated in any of that activity. These are queried using the
 * /viewActivity route that has been added as part of this PR. This differs from the notion of "Notification" as 
 * originally defined in scripts/models/Notification.ts- as events that relate to content interactions with the
 * logged in user (i.e. a reply to the user's comment, a like on their thread, etc). The original intention was 
 * that a user is subscribed to these notifications (hence the "subscription" field in the Notification class)
 * and they can be queried using the /viewNotifications route.
 * 
 * In order to make this component compatible with the updates to our notifications system, we are forced to
 * use the Notifications class here to represent the "Activity" concept discussed above. As a result, the 
 * previously required "subscription", and "_isRead" fields have been set to optional in Notifications.ts. 
 * When the type "Notification" is used in this file and in user_dashboard_row.ts, read conceptually as 
 * "Activity", not "Activity that directly involves the logged in user". 
 * 
 * Note that nowhere else should the Notification class be used in this way; the subscription and _isRead fields
 * should be included in all other instantiations.  
 */

const UserDashboard: m.Component<{}, {
  fy_count: number;
  global_count: number;
  chain_event_count: number;
  activeTab: DashboardViews;
  loadingData: boolean;
  onscroll;
  fy_notifications: DashboardActivityNotification[];
  global_notifications: DashboardActivityNotification[],
  chain_events: DashboardActivityNotification[];
}> = {
  oninit: (vnode) => {
    vnode.state.fy_count = 10;
    vnode.state.global_count = 10;
    vnode.state.chain_event_count = 10;
    vnode.state.loadingData = false;
    vnode.state.fy_notifications = [];
    vnode.state.global_notifications = [];
    vnode.state.chain_events = [];
  },
  view: (vnode) => {
    const { activeTab, fy_notifications, global_notifications, chain_events, loadingData } = vnode.state;

    // Loading Spinner
    if (loadingData) {
      return m(PageLoading, {
        title: [
          'Notifications ',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
      })
    }
    
    // Helper to load activity conditional on the selected tab
    const handleToggle = (tab: DashboardViews) => {
      if (tab === DashboardViews.FY) {
        if (fy_notifications.length === 0) vnode.state.loadingData = true;
        fetchActivity('forYou').then((activity) => {
            vnode.state.fy_notifications = activity.result.map((notification) => DashboardActivityNotification.fromJSON(notification)).reverse();
            vnode.state.loadingData = false;
            m.redraw();
        })
      } else if (tab == DashboardViews.Global) {
        if (global_notifications.length === 0) vnode.state.loadingData = true;
        fetchActivity('global').then((activity) => {
          vnode.state.global_notifications = activity.result.map((notification) => DashboardActivityNotification.fromJSON(notification)).reverse();
          vnode.state.loadingData = false;
          m.redraw();
         })
      } else if (tab == DashboardViews.Chain) {
        if (chain_events.length === 0) vnode.state.loadingData = true;
        fetchActivity('chainEvents').then((activity) => {
          vnode.state.chain_events = activity.result.map((notification) => DashboardActivityNotification.fromJSON(notification)).reverse();
          vnode.state.loadingData = false;
          m.redraw();
         });
      }
      vnode.state.activeTab = tab;
    }

    // Load activity
    if (!vnode.state.activeTab) {
      handleToggle(DashboardViews.FY);
    }

    // Scroll
    vnode.state.onscroll = _.debounce(async () => {
      if (vnode.state.activeTab === DashboardViews.FY) {
        if (!notificationsRemaining(fy_notifications.length, vnode.state.fy_count)) return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > (scrollHeight - 400)) {
          vnode.state.fy_count += 10;
          m.redraw();
        }
      } else if (vnode.state.activeTab === DashboardViews.Global) {
        if (!notificationsRemaining(global_notifications.length, vnode.state.global_count)) return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > (scrollHeight - 400)) {
          vnode.state.global_count += 10;
          m.redraw();
        }
      } else {
        if (!notificationsRemaining(chain_events.length, vnode.state.chain_event_count)) return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > (scrollHeight - 400)) {
          vnode.state.chain_event_count += 10;
          m.redraw();
        }
      }

    }, 400);

    $(window).on('scroll', vnode.state.onscroll);


    return m(Sublayout, {
      class: 'UserDashboard',
      title: [
        'Dashboard ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
    }, [
      m(Grid, {
        class: 'forum-container',
        gutter: 20
      }, [
        m(Col, { span: { md: 9, sm: 12 } }, [
          m('.title', [
            'Activity',
            m('.communities-link',{
              class:'link',
              onclick: () => {
                m.route.set('/communities');
                m.redraw();
              }
            }, [
              'View more communities',
              m(Icon, {
                name: Icons.EXTERNAL_LINK,
              })
            ]),
          ]),
          m(Tabs, {
            align: 'left',
            bordered: false,
            fluid: true,
          }, [
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
          ]),
          m('.dashboard-row-wrap', [
            (activeTab === DashboardViews.FY) && [
              fy_notifications && fy_notifications.length > 0 ? [
                fy_notifications.slice(0, vnode.state.fy_count).map((data) => {
                  return m(UserDashboardRow, { notification: data, onListPage: true, });
                }),
                notificationsRemaining(fy_notifications.length, vnode.state.fy_count)
                ? m('.Spinner', [
                  m(Spinner, { active: true })
                ])
                : ''
              ]
              : m('.no-notifications', 'No Notifications'),
            ],
            (activeTab === DashboardViews.Global) && [
              global_notifications && global_notifications.length > 0 ? [
                global_notifications.slice(0, vnode.state.global_count).map((data) => {
                  return m(UserDashboardRow, { notification: data, onListPage: true, });
                }),
                notificationsRemaining(global_notifications.length, vnode.state.global_count)
                ? m('.Spinner', [
                  m(Spinner, { active: true })
                ])
                : ''
              ]
              : m('.no-notifications', 'No Notifications'),
            ],
            (activeTab === DashboardViews.Chain) && [
              chain_events && chain_events.length > 0 ? [
                chain_events.slice(0, vnode.state.chain_event_count).map((data) => { // TODO: Change to reflect new chain events component
                  return m(UserDashboardRow, { notification: data, onListPage: true, });
                }),
                notificationsRemaining(chain_events.length, vnode.state.chain_event_count)
                ? m('.Spinner', [
                  m(Spinner, { active: true })
                ])
                : ''
              ]
              : m('.no-notifications', 'No Notifications'),
            ],
          ])
        ]),
        m(DashboardExplorePreview)
      ]),
    ]);
  }
};

export default UserDashboard;
