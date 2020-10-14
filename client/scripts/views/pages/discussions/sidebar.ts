import 'pages/discussions/sidebar.scss';

import { slugify } from 'helpers';
import m from 'mithril';

import app from 'state';
import { AddressInfo, AbridgedThread } from 'models';
import User from 'views/components/widgets/user';
import CommunityInfoModule from 'views/components/sidebar/community_info_module';

export const MostActiveUser: m.Component<{ user: AddressInfo, activityCount: number }, {}> = {
  view: (vnode) => {
    const { user, activityCount } = vnode.attrs;
    return m('.MostActiveUser', [
      m(User, {
        user,
        avatarSize: 24,
        linkify: true,
        popover: true,
      }),
      m('.activity-count', activityCount)
    ]);
  }
};

export const MostActiveThread: m.Component<{ thread: AbridgedThread }> = {
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
        user: new AddressInfo(null, thread.address, thread.authorChain, null),
        linkify: true,
      }),
    ]);
  }
};

export const ListingSidebar: m.Component<{ entity: string }> = {
  view: (vnode) => {
    const { entity } = vnode.attrs;
    const activeAddresses = app.recentActivity.getMostActiveUsers(entity);
    const activeThreads = app.recentActivity.getMostActiveThreads(entity);

    return m('.ListingSidebar.forum-container.proposal-sidebar', [
      m(CommunityInfoModule),
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
      ]),
      m('.admins-mods', [
        m('.admins-mods-header', 'Admins and moderators'),
        (app.chain || app.community) && m('.active-members', [
          (app.chain ? app.chain.meta.chain : app.community.meta).adminsAndMods.map((role) => {
            return m(User, {
              user: new AddressInfo(null, role.address, role.address_chain, null),
              avatarSize: 24,
              linkify: true,
              popover: true,
              showRole: true,
            });
          }),
        ]),
      ]),
    ]);
  }
};
