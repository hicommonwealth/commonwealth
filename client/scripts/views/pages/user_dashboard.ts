import 'pages/user_dashboard.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import $ from 'jquery';
import { TabItem, Tabs, Tag, Col, Grid, Card, Icon, Icons, Spinner } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import { NodeInfo, Notification } from 'models';
import { sortNotifications } from 'helpers/notifications';
import UserDashboardRow from 'views/components/user_dashboard_row';
import { ChainIcon } from 'views/components/chain_icon';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import DashboardExplorePreview from '../components/dashboard_explore_preview';


const fetchActivity = async () => {
  const activity = await $.post(`${app.serverUrl()}/viewActivity`, {
    jwt: app.user.jwt
  });
  return activity;
}

const notificationsRemaining = (contentLength, count) => {
  return (contentLength >= 10 && count < contentLength);
};

export enum DashboardViews {
  Latest = 'latest',
  Trending = 'trending',
  Chain = 'chain',
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
  count: number;
  activeTab: DashboardViews;
  onscroll;
  notifications: Notification[];
}> = {
  oncreate: (vnode) => {
    vnode.state.count = 10;
  },
  view: (vnode) => {
    // Load activity
    if (!vnode.state.notifications) {
      fetchActivity().then((activity) => {
        vnode.state.notifications = activity.result.map((notification) => Notification.fromJSON(notification, null));
      });
      m.redraw();
      return m(PageLoading, {
        title: [
          'Notifications ',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
      })
    }

    if (!vnode.state.activeTab) {
      vnode.state.activeTab = DashboardViews.Latest;
    }
    const { activeTab, notifications } = vnode.state;

    vnode.state.onscroll = _.debounce(async () => {
      if (!notificationsRemaining(notifications.length, vnode.state.count)) return;
      const scrollHeight = $(document).height();
      const scrollPos = $(window).height() + $(window).scrollTop();
      if (scrollPos > (scrollHeight - 400)) {
        vnode.state.count += 10;
        m.redraw();
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
        m(Col, { span: { md: 9 } }, [
          m('.title', 'Activity'),
          m(Tabs, {
            align: 'left',
            bordered: false,
            fluid: true,
          }, [
            m(TabItem, {
              label: capitalize(DashboardViews.Latest),
              active: activeTab === DashboardViews.Latest,
              onclick: () => {
                vnode.state.activeTab = DashboardViews.Latest;
              },
            }),
            m(TabItem, {
              label: capitalize(DashboardViews.Chain),
              active: activeTab === DashboardViews.Chain,
              onclick: () => {
                vnode.state.activeTab = DashboardViews.Chain;
              },
            }),
          ]),
          m('.dashboard-row-wrap', [
            notifications && notifications.length > 0
            ? [
              notifications.slice(0, vnode.state.count).map((data) => {
                return m(UserDashboardRow, { notification: data, onListPage: true, });
              }),
              notificationsRemaining(notifications.length, vnode.state.count)
              ? m('.infinite-scroll-spinner-wrap .text-center', [
                m(Spinner, { active: true })
              ])
              : ''
            ]
            : m('.no-notifications', 'No Notifications'),
          ])
        ]),
        m(DashboardExplorePreview)
      ]),
    ]);
  }
};

export default UserDashboard;
