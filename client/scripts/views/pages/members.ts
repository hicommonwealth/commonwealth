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
import Compound from 'controllers/chain/ethereum/compound/adapter';

import { BigNumber } from 'ethers';

interface MemberInfo {
  chain: string;
  address: string;
  count: number;
  votes: BigNumber;
}

const MEMBERS_PER_PAGE = 20;

const MembersPage : m.Component<{}, { membersRequested: boolean, membersLoaded: MemberInfo[],
pageToLoad: number, totalMembers: number, isCompound: boolean }> = {
  oninit: async () => {

  },
  view: (vnode) => {
    $(window).on('scroll', () => {
      const elementTarget = document.getElementsByClassName('sublayout-main-col')[0];
      if ($(window).scrollTop() + $(window).height()
      >= (elementTarget as HTMLElement).offsetTop + (elementTarget as HTMLElement).offsetHeight) {
        if (!vnode.state.membersRequested && vnode.state.membersLoaded === []) {
          vnode.state.membersRequested = true;
          vnode.state.pageToLoad++;
          m.redraw();
        }
      }
    });

    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) { 
      return m(PageLoading, {
        message: 'Loading members',
        title: [
          'Members',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
        showNewProposalButton: true,
      });
    } else {
      if (!vnode.state.membersRequested && !vnode.state.pageToLoad && !vnode.state.membersLoaded) {
        vnode.state.membersRequested = true;
        vnode.state.membersLoaded = [];
        vnode.state.pageToLoad = 0;
        vnode.state.isCompound = app.chain instanceof Compound;

      }
    }
    // get members once

    const activeInfo = app.community ? app.community.meta : app.chain.meta.chain;
    if (vnode.state.membersRequested) {
      vnode.state.membersRequested = false;
      activeInfo.getMembersByPage(activeInfo.id, vnode.state.pageToLoad, MEMBERS_PER_PAGE)
        .then(({ result, total }) => {
          const newMembers = result.map(((o, i) => {
            o.address = o.Address.address;
            o.chain = o.chain_id;
            return o;
          }));

          vnode.state.membersLoaded = vnode.state.membersLoaded.concat(newMembers);
          vnode.state.totalMembers = total;

          const offset = vnode.state.membersLoaded.length - newMembers.length;
          if (vnode.state.isCompound) {
            newMembers.forEach(async(o, i) => {
              let firstFunc = Promise.resolve()   
              if (!app.chain.apiInitialized) {
                firstFunc = app.chain.initApi();
              }
              firstFunc
              .then(()=>(app.chain as Compound).chain.getVotingPower(o.address))
              .then((votes)=>{
                vnode.state.membersLoaded[offset+i].votes = votes;
              });
            })
          }
          m.redraw();
        });
    }

    const isAdmin = app.user.isSiteAdmin
    || app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() });
    const isMod = app.user.isRoleOfCommunity({
      role: 'moderator', chain: app.activeChainId(), community: app.activeCommunityId()
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
          m('th.align-right', 'Votes'),
        ]),
        vnode.state.membersLoaded.map((info) => {
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
            m('td.align-right', info.votes ? info.votes.toString() : ''),
          ]);
        })]),
      !vnode.state.totalMembers
      || vnode.state.membersLoaded.length < vnode.state.totalMembers
        ? m('tr', [ m(Spinner, { active: true, size: 'lg' }) ])
        : null
    ]);
  }
};

export default MembersPage;
