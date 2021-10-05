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
import { pluralize } from 'helpers';
import { BigNumber } from 'ethers';
import { notifyError } from 'controllers/app/notifications';
import { formatAddressShort } from 'utils';
import { CommunityOptionsPopover } from './discussions';

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
          `Delegate to ${
            name
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
          disabled: !app.isLoggedIn(),
          onclick: async (e) => {
            chainController?.chain
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
    $(window).on('scroll', () => {
      const elementTarget =
        document.getElementsByClassName('sublayout-main-col')[0];
      if (
        $(window).scrollTop() + $(window).height() >=
        (elementTarget as HTMLElement).offsetTop +
          (elementTarget as HTMLElement).offsetHeight
      ) {
        if (
          !vnode.state.requestMembers &&
          vnode.state.members.length !== vnode.state.totalMemberCount
        ) {
          vnode.state.requestMembers = true;
          vnode.state.pageToLoad++;
          m.redraw();
        }
      }
    });
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
        !vnode.state.members
      ) {
        vnode.state.requestMembers = true;
        vnode.state.members = [];
        vnode.state.pageToLoad = 0;
      }
    }
    // get members once

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

          app.recentActivity.getMostActiveUsers().map((user) => {
            newMembers.map((u) => {
              const { chain, address } = user.info;
              if (u.address === user.info.address) {
                u.count = user.count;
              }
              return { chain, address, count: user.count };
            });
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

    const isAdmin = app.user.isSiteAdmin;
    app.user.isAdminOfEntity({
      chain: app.activeChainId(),
      community: app.activeCommunityId(),
    });
    const isMod = app.user.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
      community: app.activeCommunityId(),
    });

    const {
      totalMemberCount,
      pageToLoad,
      requestMembers,
      members,
      delegates,
      voteEvents,
    } = vnode.state;

    const noCommunityMembers =
      totalMemberCount === 0 && pageToLoad === 0 && !requestMembers;

    return m(
      Sublayout,
      {
        class: 'MembersPage',
        title: [
          'Members',
          m(CommunityOptionsPopover, { isAdmin, isMod }),
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
        (totalMemberCount > 0 && members?.length > 0) || noCommunityMembers
          ? m(Table, [
              m('tr', [
                m('th', 'Member'),
                m('th.align-right', 'Posts'),
                delegates && m('th.align-right', 'Voting Power'),
                delegates && m('th.align-right', 'Delegate'),
              ]),
              members.map((info) => {
                const profile = app.profiles.getProfile(
                  info.chain,
                  info.address
                );

                return m('tr', [
                  m('td.members-item-info', [
                    m(
                      'a',
                      {
                        href: `/${app.activeId()}/account/${
                          info.address
                        }?base=${info.chain}`,
                        onclick: (e) => {
                          e.preventDefault();
                          localStorage[`${app.activeId()}-members-scrollY`] =
                            window.scrollY;
                          navigateToSubpage(
                            `/account/${info.address}?base=${info.chain}`
                          );
                        },
                      },
                      [
                        m(User, { user: profile, showRole: true }),
                        voteEvents[info.address] &&
                          m(Tooltip, {
                            trigger: m(Tag, {
                              label: `${voteEvents[info.address].length} event${
                                voteEvents[info.address].length !== 1 && 's'
                              }`,
                              size: 'xs',
                            }),
                            content: voteEvents[info.address].map((o) => {
                              return m(
                                'div',
                                `Proposal #${o.event_data.id}, ${
                                  o.event_data.support ? 'YES' : 'NO'
                                }, ${o.event_data.votes} votes`
                              );
                            }),
                          }),
                      ]
                    ),
                  ]),
                  m('td.align-right', [
                    info.count > 0 &&
                      `${pluralize(info.count, 'post')} this month`,
                  ]),
                  delegates &&
                    m('td.align-right', [
                      info.votes !== undefined
                        ? `${info.votes.toNumber().toFixed(2)} ${
                            app.chain.meta.chain.symbol
                          }`
                        : m(Spinner, { active: true, size: 'xs' }),
                    ]),
                  delegates &&
                    m(
                      'td.align-right',
                      m(Button, {
                        label: 'Delegate',
                        intent: 'primary',
                        onclick: async (e) => {
                          app.modals.create({
                            modal: DelegateModal,
                            data: {
                              address: info.address,
                              name: profile.name,
                              symbol: app.chain.meta.chain.symbol,
                              chainController: app.chain,
                            },
                          });
                        },
                      })
                    ),
                ]);
              }),
            ])
          : m(Spinner, {
              active: true,
              fill: true,
              size: 'lg',
              message: 'Loading members...',
            }),
        members.length < totalMemberCount &&
          m('tr.spinner-wrap', [m(Spinner, { active: true, size: 'lg' })]),
      ]
    );
  },
};

export default MembersPage;
