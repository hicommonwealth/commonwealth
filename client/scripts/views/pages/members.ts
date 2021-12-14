import 'pages/members.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import { Button, Input, Tag, Table, Tooltip, Spinner } from 'construct-ui';
import $ from 'jquery';

import app from 'state';
import { navigateToSubpage } from 'app';

import PageLoading from 'views/pages/loading';
import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import { BigNumber } from 'ethers';
import { notifyError } from 'controllers/app/notifications';
import { formatAddressShort } from 'utils';
import { CommunityOptionsPopover } from './discussions';

// The number of member profiles that are batch loaded
const DEFAULT_MEMBER_REQ_SIZE = 20;

interface MemberInfo {
  chain: string;
  address: string;
  count: number;
  votes: BigNumber;
}

const MEMBERS_PER_PAGE = 20;

const DelegateModal: m.Component<
  {
    address: string;
    name: string;
    symbol: string;
    chainController: Compound;
  },
  { delegateAmount: number }
> = {
  view: (vnode) => {
    const { address, name, symbol, chainController } = vnode.attrs;
    return m('.DelegateModal', [
      m('.compact-modal-title', [
        m(
          'h3',
          `Delegate to ${name
            ? `${name} at Address: ${formatAddressShort(address)}`
            : `Anonymous at Address: ${formatAddressShort(address)}`
          }`
        ),
      ]),
      m('.compact-modal-body', [
        m('div', `Amount ${symbol} to delegate`),
        m(Input, {
          title: 'Add amount',
          oninput: (e) => {
            const num = (e.target as any).value;
            if (!Number.isNaN(parseInt(num, 10))) {
              vnode.state.delegateAmount = num;
            }
          },
        }),
        m(Button, {
          label: 'Delegate',
          intent: 'primary',
          disabled:
            !app.user.activeAccount ||
            !app.user.isMember({ account: app.user.activeAccount, chain: app.activeChainId() }),
          onclick: async (e) => {
            chainController?.chain
            // TODO: reconcile against original
              .setDelegate(vnode.attrs.address, vnode.state.delegateAmount)
              .catch((err) => {
                if (err.message.indexOf('delegates underflow') > -1) {
                  err.message =
                    'You do not have the requested number of votes to delegate';
                }
                notifyError(err.message);
              });
          },
        }),
      ]),
    ]);
  },
};

const MembersPage: m.Component<
  {},
  {
    requestMembers: boolean;
    members: MemberInfo[];
    pageToLoad: number;
    totalMemberCount: number;
    delegates: boolean;
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
    vnode.state.delegates = app.chain instanceof Compound;
    const chainController =
      app.chain instanceof Compound ? (app.chain as Compound) : null;

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

    const activeInfo = app.community
      ? app.community.meta
      : app.chain.meta.chain;
    if (vnode.state.requestMembers) {
      vnode.state.requestMembers = false;
      activeInfo
        .getMembersByPage(
          app.activeId(),
          vnode.state.pageToLoad,
          MEMBERS_PER_PAGE
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
          if (vnode.state.delegates) {
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
        })
        .then(() => m.redraw());
    }

    const {
      totalMemberCount,
      pageToLoad,
      requestMembers,
      members,
      delegates,
    } = vnode.state;

    const noCommunityMembers =
      totalMemberCount === 0 && pageToLoad === 0 && !requestMembers;

    // const navigatedFromAccount = app.lastNavigatedBack()
    //   && app.lastNavigatedFrom().includes(`/${app.activeId()}/account/`)
    //   && localStorage[`${app.activeId()}-members-scrollY`]

    // // Return to correct scroll position upon redirect from accounts page
    // if (navigatedFromAccount && !vnode.state.initialScrollFinished) {
    //   vnode.state.initialScrollFinished = true
    //   setTimeout(() => {
    //     window.scrollTo(0, Number(localStorage[`${app.activeId()}-members-scrollY`]));
    //   }, 100);
    // }

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
    console.log({
      totalMemberCount,
      members,
      numProfilesLoaded
    })
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
        m('.title', 'Members'),
        (totalMemberCount > 0 && members?.length > 0)
          && m(Table, [
              m('tr', [
                m('th', 'Member'),
                m('th.align-right', 'Posts / Month'),
                delegates && m('th.align-right', 'Voting Power'),
                delegates && m('th.align-right', 'Delegate'),
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
                  m('td.align-right', member.count),
                  delegates
                  && m('td.align-right', [
                      member.votes !== undefined
                        ? `${member.votes.toNumber().toFixed(2)} ${app.chain.meta.chain.symbol
                        }`
                        : m(Spinner, { active: true, size: 'xs' }),
                    ]),
                  delegates
                  && m(
                    'td.align-right',
                    m(Button, {
                      label: 'Delegate',
                      intent: 'primary',
                      disabled:
                        !app.user.activeAccount ||
                        !app.user.isMember({ account: app.user.activeAccount, chain: app.activeChainId() }),
                      onclick: async (e) => {
                        app.modals.create({
                          modal: DelegateModal,
                          data: {
                            address: profileInfo.address,
                            name: profileInfo.name,
                            symbol: app.chain.meta.chain.symbol,
                            chainController: app.chain,
                          },
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
