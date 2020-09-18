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
        avatarSize: 24
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
        user: new AddressInfo(null, thread.author, thread.authorChain, null)
      })
    ]);
  }
};
