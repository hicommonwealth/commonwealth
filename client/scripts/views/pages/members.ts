import 'pages/members.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment';
import { Input, List, ListItem, PopoverMenu, MenuItem, Icon, Icons, Tag } from 'construct-ui';

import app from 'state';
import { AddressInfo, AbridgedThread } from 'models';
import { pluralize, link } from 'helpers';

import PageLoading from 'views/pages/loading';
import User, { UserBlock } from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import ManageCommunityModal from 'views/modals/manage_community_modal';
import { formatAddressShort } from '../../../../shared/utils';
import { CommunityOptionsPopover } from './discussions';

interface MemberInfo {
  chain: string;
  address: string;
  count: number;
}

const MembersPage : m.Component<{}, { membersRequested: boolean, membersLoaded: MemberInfo[] }> = {
  view: (vnode) => {
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return m(PageLoading, {
      message: 'Loading members',
      title: [
        'Members',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    });

    // get members once
    const activeInfo = app.community ? app.community.meta : app.chain.meta.chain;
    if (!vnode.state.membersRequested) {
      vnode.state.membersRequested = true;
      activeInfo.getMembers(activeInfo.id).then(() => {
        const activeMembersHash = {};
        const membersActive: MemberInfo[] = app.recentActivity.getMostActiveUsers().map((user) => {
          const { chain, address } = user.info;
          activeMembersHash[`${chain}##${address}`] = true;
          return { chain, address, count: user.count };
        });
        const membersInactive: MemberInfo[] = activeInfo.members.map((role) => {
          return { address: role.address, chain: role.address_chain, count: 0 };
        }).filter((info) => {
          const { chain, address } = info;
          return (!activeMembersHash[`${chain}##${address}`]);
        });
        vnode.state.membersLoaded = membersActive.concat(membersInactive).sort((a, b) => b.count - a.count);
        m.redraw();

        // restore scroll position
        if (app.lastNavigatedBack() && app.lastNavigatedFrom().includes(`/${app.activeId()}/account/`)
            && localStorage[`${app.activeId()}-members-scrollY`]) {
          setTimeout(() => {
            window.scrollTo(0, Number(localStorage[`${app.activeId()}-members-scrollY`]));
          }, 100);
        }
      });
    }

    const isAdmin = app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() });
    const isMod = app.user.isRoleOfCommunity({
      role: 'moderator', chain: app.activeChainId(), community: app.activeCommunityId()
    });

    if (!vnode.state.membersLoaded) return m(PageLoading, {
      message: 'Loading members',
      title: [
        'Members',
        m(CommunityOptionsPopover, { isAdmin, isMod }),
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    });

    return m(Sublayout, {
      class: 'MembersPage',
      title: [
        'Members',
        m(CommunityOptionsPopover, { isAdmin, isMod }),
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      // m('.members-caption', `Showing ${pluralize(activeAddresses.length, 'active member')}`),
      m('.members-list', vnode.state.membersLoaded.map((info) => {
        const profile = app.profiles.getProfile(info.chain, info.address);
        return m('a.members-item', {
          href: `/${app.activeId()}/account/${info.address}?base=${info.chain}`,
          onclick: (e) => {
            e.preventDefault();
            localStorage[`${app.activeId()}-members-scrollY`] = window.scrollY;
            m.route.set(`/${app.activeId()}/account/${info.address}?base=${info.chain}`);
          }
        }, [
          m('.members-item-icon', [
            m(User, { user: profile, avatarSize: 36, avatarOnly: true }),
          ]),
          m('.members-item-info', [
            m(User, { user: profile, hideAvatar: true, popover: true, showRole: true }),
            profile.headline
              ? m('.members-item-headline', profile.headline)
              : m('.members-item-address', formatAddressShort(profile.address, profile.chain, true)),
            info.count > 0 && m('.members-item-posts', [
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
