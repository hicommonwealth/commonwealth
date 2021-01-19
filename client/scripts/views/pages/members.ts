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

const MembersPage : m.Component<{}, { membersRequested: boolean }> = {
  view: (vnode) => {
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return m(PageLoading, {
      title: 'Members',
      showNewProposalButton: true,
    });

    // get members once
    const activeInfo = app.community ? app.community.meta : app.chain.meta.chain;
    if (!activeInfo.members?.length && !vnode.state.membersRequested) {
      vnode.state.membersRequested = true;
      activeInfo.getMembers(activeInfo.id).then(() => {
        m.redraw();
      });
    }
    if (!activeInfo.members) return m(PageLoading, {
      title: 'Members',
      showNewProposalButton: true,
    });

    const activeAddresses = app.recentActivity.getMostActiveUsers();

    const otherMembers = activeInfo.members.map((role) => {
      return { address: role.address, chain: role.address_chain };
    }) as any;

    return m(Sublayout, {
      class: 'MembersPage',
      title: 'Members',
      showNewProposalButton: true,
    }, [
      // m('.members-caption', `Showing ${pluralize(activeAddresses.length, 'active member')}`),
      m('.members-list', activeAddresses.map((user) => {
        const { chain, address } = user.info;
        return { chain, address, count: user.count };
      }).concat(otherMembers).map((info) => {
        const profile = app.profiles.getProfile(info.chain, info.address);
        return link('a.members-item', `/${app.activeId()}/account/${info.address}?base=${info.chain}`, [
          m('.members-item-icon', [
            m(User, { user: profile, avatarSize: 36, avatarOnly: true }),
          ]),
          m('.members-item-left', [
            m(User, { user: profile, hideAvatar: true, popover: true, showRole: true }),
            profile.headline
              ? m('.members-item-headline', profile.headline)
              : m('.members-item-address', formatAddressShort(profile.address, profile.chain)),
            info.count && m('.members-item-posts', [
              pluralize(info.count, 'post'),
              ' this month'
            ]),
          ]),
        ]);
      })),
    ]);
  }
};

export default MembersPage;
