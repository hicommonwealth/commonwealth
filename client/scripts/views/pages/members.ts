import 'pages/members.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';
import { Input, List, ListItem, PopoverMenu, MenuItem, Icon, Icons, Tag } from 'construct-ui';

import app from 'state';
import { AddressInfo, AbridgedThread } from 'models';
import { pluralize, link } from 'helpers';

import PageLoading from 'views/pages/loading';
import User, { UserBlock } from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import ManageCommunityModal from 'views/modals/manage_community_modal';
import { formatAddressShort } from '../../../../shared/utils';

// const activeThreads = app.recentActivity.getMostActiveThreads(entity);
// const MostActiveThread: m.Component<{ thread: AbridgedThread }> = {
//   view: (vnode) => {
//     const { thread } = vnode.attrs;
//     return m('.MostActiveThread', [
//       m('.active-thread', [
//         m('a', {
//           href: '#',
//           onclick: (e) => {
//             e.preventDefault();
//             m.route.set(`/${app.activeId()}/proposal/${thread.slug}/${thread.identifier}-`
//               + `${slugify(thread.title)}`);
//           }
//         }, thread.title),
//       ]),
//       m(User, {
//         user: new AddressInfo(null, thread.address, thread.authorChain, null),
//         linkify: true,
//       }),
//     ]);
//   }
// };

const MembersPage : m.Component<{}, {}> = {
  view: (vnode) => {
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return m(PageLoading, {
      title: 'Members',
      showNewProposalButton: true,
    });

    const activeAddresses = app.recentActivity.getMostActiveUsers();

    return m(Sublayout, {
      class: 'MembersPage',
      title: 'Members',
      showNewProposalButton: true,
    }, [
      // m('.members-caption', `Showing ${pluralize(activeAddresses.length, 'active member')}`),
      m('.members-list', activeAddresses.map((user) => {
        const profile = app.profiles.getProfile(user.info.chain, user.info.address);
        return link('a.members-item', `/${app.activeId()}/account/${user.info.address}?base=${user.info.chain}`, [
          m('.members-item-icon', [
            m(User, { user: profile, avatarSize: 36, avatarOnly: true }),
          ]),
          m('.members-item-left', [
            m(User, { user: profile, hideAvatar: true, popover: true, showRole: true }),
            profile.headline
              ? m('.members-item-headline', profile.headline)
              : m('.members-item-address', formatAddressShort(profile.address, profile.chain)),
          ]),
          m('.members-item-right', [
            m('.activity-count', [
              pluralize(user.count, 'post'),
              ' this month'
            ]),
          ]),
        ]);
      })),
    ]);
  }
};

export default MembersPage;
