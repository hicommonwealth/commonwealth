import 'pages/discussions/sidebar.scss';

import m from 'mithril';
import app from 'state';
import User from 'views/components/widgets/user';
import { AddressInfo } from 'models';


export const MostActiveUser: m.Component<{ user: AddressInfo, activityCount: number }, {}> = {
  view: (vnode) => {
    const { user, activityCount } = vnode.attrs;
    return m('.MostActiveUser', [
      m(User, {
        user,
        avatarSize: 24,
        linkify: true,
        tooltip: true,
      }),
      m('.activity-count', activityCount)
    ]);
  }
};

export const ListingSidebar: m.Component<{ entity: string }> = {
  view: (vnode) => {
    const { entity } = vnode.attrs;
    const activeAddresses = app.recentActivity.getMostActiveUsers(entity);

    return m('.ListingSidebar.forum-container.proposal-sidebar', [
      m('.user-activity', [
        m('.user-activity-header', 'Active members'),
        m('.active-members', activeAddresses.map((user) => {
          return m(MostActiveUser, {
            user: user.addressInfo,
            activityCount: user.postCount
          });
        })),
      ]),
    ]);
  }
};
