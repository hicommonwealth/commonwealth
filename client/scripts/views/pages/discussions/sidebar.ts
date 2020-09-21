import 'pages/discussions/sidebar.scss';

import _ from 'lodash';
import m from 'mithril';
import app from 'state';
import User from 'views/components/widgets/user';
import { slugify } from 'helpers';
import { AddressInfo, OffchainThread } from 'models';


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

export const MostActiveThread: m.Component<{ thread: OffchainThread }> = {
  view: (vnode) => {
    const { thread } = vnode.attrs;
    return m('.MostActiveThread', [
      m('.active-thread', [
        m('a', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeId()}/proposal/${thread.slug}/${thread.identifier}-`
              + `${slugify(thread.title)}`);
          }
        }, thread.title),
      ]),
      m(User, {
        user: new AddressInfo(null, thread.author, thread.authorChain, null),
        linkify: true,
      })
    ]);
  }
};

export const ListingSidebar: m.Component<{ entity: string }> = {
  view: (vnode) => {
    const { entity } = vnode.attrs;
    const activeThreads = app.recentActivity.getThreadsByCommunity(entity).slice(0, 5);
    const activeAddresses = app.recentActivity.getMostActiveUsers(entity);
    const activeThreadIds = app.recentActivity.getMostActiveThreadIds(entity);
    console.log(activeThreadIds);

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
      m('.forum-activity', [
        m('.forum-activity-header', 'Active threads'),
        m('.active-threads', activeThreads.map((thread) => {
          return m(MostActiveThread, { thread });
        }))
      ])
    ]);
  }
};
