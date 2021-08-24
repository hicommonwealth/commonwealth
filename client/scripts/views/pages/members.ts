import 'pages/members.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import { Tag, Table, Spinner } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';

import PageLoading from 'views/pages/loading';
import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import { CommunityOptionsPopover } from './discussions';

interface MemberInfo {
  chain: string;
  address: string;
  count: number;
}

const MEMBERS_PER_PAGE = 20;

const MembersPage : m.Component<{}, { membersRequested: boolean, membersLoaded: MemberInfo[],
membersToShow: number }> = {
  view: (vnode) => {
    $(window).on('scroll', _.debounce(
      () => {
        if ($(window).scrollTop() + $(window).height() === $(document).height()) {
          if (vnode.state.membersToShow < vnode.state.membersLoaded.length) {
            vnode.state.membersToShow += MEMBERS_PER_PAGE;
          }
          m.redraw();
        }
      },
      400
    ));

    if (!vnode.state.membersToShow) { vnode.state.membersToShow = MEMBERS_PER_PAGE; }

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

    const isAdmin = app.user.isSiteAdmin
    || app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() });
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
      m('.title', 'Members'),
      m(Table, [
        m('tr', [
          m('th', 'Member'),
          m('th.align-right', 'Posts/ Month'),
        ]),
        vnode.state.membersLoaded.slice(0, vnode.state.membersToShow).map((info) => {
          const profile = app.profiles.getProfile(info.chain, info.address);
          return m('tr', [
            m('td.members-item-info', [
              m('a', {
                href: `/${app.activeId()}/account/${info.address}?base=${info.chain}`,
                onclick: (e) => {
                  e.preventDefault();
                  localStorage[`${app.activeId()}-members-scrollY`] = window.scrollY;
                  navigateToSubpage(`/account/${info.address}?base=${info.chain}`);
                }
              }, [
                m(User, { user: profile, showRole: true }),
              ]),
            ]),
            m('td.align-right', info.count),
          ]);
        })]),
      vnode.state.membersToShow < vnode.state.membersLoaded.length
        ? m('.infinite-scroll-spinner-wrap', [
          m(Spinner, { active: true })
        ])
        : null
    ]);
  }
};

export default MembersPage;
