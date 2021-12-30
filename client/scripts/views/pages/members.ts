import 'pages/members.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import { Button, Input, Tag, Table, Tooltip, Spinner } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';

import PageLoading from 'views/pages/loading';
import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import { BigNumber } from 'ethers';
import { notifyError } from 'controllers/app/notifications';
import { CommunityOptionsPopover } from './discussions';

interface MemberInfo {
  chain: string;
  address: string;
  count: number;
  votes: BigNumber;
}

// The number of member profiles that are batch loaded
const MEMBERS_PER_PAGE = 20;

const MembersPage: m.Component<
  {},
  {
    requestMembers: boolean;
    members: MemberInfo[];
    pageToLoad: number;
    totalMemberCount: number;
    chainSupportsDelegates: boolean;
    activeUserIsDelegate: boolean;
    voteEvents;
    profilesFinishedLoading: boolean;
    numProfilesLoaded: number;
    initialProfilesLoaded: boolean;
    initialScrollFinished: boolean;
    onscroll;
  }
> = {
  oninit: (vnode) => {
    $.get(`/api/getChainEvents?type=${app.activeChainId()}-vote-cast`).then(
      ({ result }) => {
        // Sort by address which voted
        const sortedResults = {};
        result.forEach((r) => {
          const address = r.event_data.voter;
          if (!sortedResults[address]) sortedResults[address] = [];
          sortedResults[address].push(r);
        });
        vnode.state.voteEvents = sortedResults;
      }
    );
  },
  view: (vnode) => {
    vnode.state.chainSupportsDelegates = app.chain instanceof Compound;
    const chainController =
      app.chain instanceof Compound ? (app.chain as Compound) : null;
    if (vnode.state.activeUserIsDelegate === undefined && chainController?.chain?.compoundApi?.Token) {
      (app.chain as Compound).chain.isDelegate(app.user.activeAccount.address).then((res) => {
        console.log({ res });
        vnode.state.activeUserIsDelegate = res;
      });
    }

    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) {
      return m(PageLoading, {
        message: 'Loading members',
        title: [
          'Members',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      });
    } else {
      if (
        !vnode.state.requestMembers &&
        !vnode.state.pageToLoad &&
        !vnode.state.members?.length
      ) {
        vnode.state.requestMembers = true;
        vnode.state.members = [];
        vnode.state.pageToLoad = 0;
      }
    }

    const navigatedFromAccount = app.lastNavigatedBack()
      && app.lastNavigatedFrom().includes(`/${app.activeId()}/account/`)
      && localStorage[`${app.activeId()}-members-scrollY`]
      && localStorage[`${app.activeId()}-members-numProfilesAlreadyLoaded`];

    // TODO: Members should be stored to prevent redundant fetches each time
    // the members page is navigated to.
    const activeInfo = app.community
      ? app.community.meta
      : app.chain.meta.chain;
    let outsizedFirstPageFetch;
    if (vnode.state.pageToLoad === 0 && navigatedFromAccount) {
      localStorage[`${app.activeId()}-members-numProfilesAlreadyLoaded`];
    }
    if (vnode.state.requestMembers) {
      vnode.state.requestMembers = false;
      activeInfo
        .getMembersByPage(
          app.activeId(),
          vnode.state.pageToLoad,
          outsizedFirstPageFetch || MEMBERS_PER_PAGE
        )
        .then(({ result, total }) => {
          const newMembers = result.map((o) => {
            o.address = o.Address.address;
            o.chain = o.chain_id;
            return o;
          });

          vnode.state.members = vnode.state.members.concat(newMembers);
          vnode.state.totalMemberCount = total;

          const offset = vnode.state.members.length - newMembers.length;
          if (vnode.state.chainSupportsDelegates) {
            return app.chain.initApi().then(() =>
              Promise.all(
                newMembers.map((o, i) => {
                  return chainController?.chain
                    .getVotingPower(o.address)
                    .then((votes) => {
                      vnode.state.members[offset + i].votes = votes;
                    });
                })
              )
            );
          }

          // Return to correct scroll position upon redirect from accounts page
          if (navigatedFromAccount && !vnode.state.initialScrollFinished) {
            vnode.state.initialScrollFinished = true
            setTimeout(() => {
              window.scrollTo(0, Number(localStorage[`${app.activeId()}-members-scrollY`]));
            }, 100);
          }
        })
        .then(() => m.redraw());
    }

    const {
      totalMemberCount,
      pageToLoad,
      requestMembers,
      members,
      chainSupportsDelegates,
    } = vnode.state;

    const noCommunityMembers = (totalMemberCount === 0 && pageToLoad === 0 && !requestMembers);

    // Infinite Scroll
    $(window).off('scroll');
    vnode.state.onscroll = _.debounce(() => {
      const scrollHeight = $(document).height();
      const scrollPos = $(window).height() + $(window).scrollTop();
      if (scrollPos > scrollHeight - 400) {
        if (
          !vnode.state.requestMembers &&
          vnode.state.members.length !== vnode.state.totalMemberCount
        ) {
          vnode.state.requestMembers = true;
          vnode.state.pageToLoad++;
          m.redraw();
        }
      }
    }, 400)
    $(window).on('scroll', vnode.state.onscroll);

    const { numProfilesLoaded } = vnode.state;
    return m(
      Sublayout,
      {
        class: 'MembersPage',
        title: [
          'Members',
          m(CommunityOptionsPopover),
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      },
      [
        m('.table-title', 'Members'),
        (totalMemberCount > 0 && members?.length > 0)
          && m(Table, [
              m('tr', [
                m('th', 'Member'),
                m('th', 'Posts / Month'),
                chainSupportsDelegates && m('th', 'Voting Power'),
                chainSupportsDelegates && m('th', 'Delegate'),
              ]),
              vnode.state.members.map((member) => {
                const profileInfo = app.profiles.getProfile(member.chain, member.address);
                return m('tr', [
                  m('td.members-item-info', [
                    m('a', {
                      href: `/${app.activeId()}/account/${profileInfo.address}?base=${profileInfo.chain}`,
                      onclick: (e) => {
                        e.preventDefault();
                        localStorage[`${app.activeId()}-members-scrollY`] = window.scrollY;
                        localStorage[`${app.activeId()}-members-numProfilesAlreadyLoaded`] =
                          numProfilesLoaded;
                        navigateToSubpage(`/account/${profileInfo.address}?base=${profileInfo.chain}`);
                      }
                    }, [
                      m(User, { user: profileInfo, showRole: true }),
                    ]),
                  ]),
                  m('td', member.count),
                  chainSupportsDelegates
                  && m('td', [
                      member.votes
                        ? `${member.votes.toNumber()?.toFixed(2)} ${app.chain.meta.chain.symbol
                        }`
                        : m(Spinner, { active: true, size: 'xs' }),
                    ]),
                  chainSupportsDelegates
                  && m(
                    'td',
                    m(Button, {
                      label: 'Delegate',
                      intent: 'primary',
                      disabled:
                        !app.user.activeAccount ||
                        !app.user.isMember({ account: app.user.activeAccount, chain: app.activeChainId() }) ||
                        !vnode.state.activeUserIsDelegate,
                      onclick: async (e) => {
                        chainController?.chain
                          .setDelegate(profileInfo.address)
                          .catch((err) => {
                            if (err.message.indexOf('delegates underflow') > -1) {
                              err.message =
                                'You do not have the requested number of votes to delegate';
                            }
                            notifyError(err.message);
                          });
                      },
                    })
                  ),
                ]);
              }),
            ]),
        m('.infinite-scroll-wrapper', [
        (!noCommunityMembers && !vnode.state.profilesFinishedLoading)
          ? m('.infinite-scroll-spinner-wrap', [
            m(Spinner, {
              active: true,
              size: 'lg',
            }),
          ])
          : m('.infinite-scroll-reached-end', [
            `Showing all ${vnode.state.members.length} community members`,
          ])
        ]),
      ])
    }
};

export default MembersPage;
