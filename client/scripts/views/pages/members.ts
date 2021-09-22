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
import { CommunityOptionsPopover } from './discussions';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import { pluralize } from 'helpers';
import { BigNumber } from 'ethers';
import { notifyError } from 'controllers/app/notifications';
import { formatAddressShort } from 'utils';

interface MemberInfo {
  chain: string;
  address: string;
  count: number;
  votes: BigNumber;
}

const MEMBERS_PER_PAGE = 20;

const DelegateModal: m.Component<
  { address: string; name: string; symbol: string },
  { delegateAmount: number }
> = {
  view: (vnode) => {
    return m('.DelegateModal', [
      m('.compact-modal-title', [
        m(
          'h3',
          `Delegate to ${
            vnode.attrs.name
              ? `${vnode.attrs.name} at Address: ${formatAddressShort(
                  vnode.attrs.address
                )}`
              : `Anonymous at Address: ${formatAddressShort(
                  vnode.attrs.address
                )}`
          }`
        ),
      ]),
      m('.compact-modal-body', [
        m('div', `Amount ${vnode.attrs.symbol} to delegate`),
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
          onclick: async (e) => {
            (app.chain as Compound)?.chain.setDelegate(vnode.attrs.address, vnode.state.delegateAmount)
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
  }
};

const MembersPage: m.Component<
  {},
  {
    membersRequested: boolean;
    membersLoaded: MemberInfo[];
    pageToLoad: number;
    totalMembers: number;
    isCompound: boolean;
    voteEvents;
  }
> = {
  oninit: (vnode) => {
    $.get(`/api/getChainEvents?type=${app.activeId}-vote-cast`).then(({ result }) => {
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
    vnode.state.isCompound = (app.chain instanceof Compound) ? true: false;

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
        !vnode.state.membersRequested &&
        !vnode.state.pageToLoad &&
        !vnode.state.membersLoaded
      ) {
        vnode.state.membersRequested = true;
        vnode.state.membersLoaded = [];
        vnode.state.pageToLoad = 0
      }
    }
    // get members once

    const activeInfo = app.community ? app.community.meta : app.chain.meta.chain;
    if (vnode.state.membersRequested) {
      vnode.state.membersRequested = false;
      activeInfo
        .getMembersByPage(
          activeInfo.id,
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
            })
          });

          vnode.state.membersLoaded = vnode.state.membersLoaded.concat(newMembers);
          vnode.state.totalMembers = total;

          // TODO: Change these "isCompound" checks
          const offset = vnode.state.membersLoaded.length - newMembers.length;
          if (vnode.state.isCompound) {
            return app.chain.initApi().then(() =>
              Promise.all(
                newMembers.map((o, i) => {
                  return (app.chain as Compound).chain
                    .getVotingPower(o.address)
                    .then((votes) => {
                      vnode.state.membersLoaded[offset + i].votes = votes;
                    });
                })
              ).then(() => m.redraw())
            );
          }
        });
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
    return m(Sublayout, {
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
      }, [
        m('.title', 'Members'),
        m(Table, [
          m('tr', [
            m('th', 'Member'),
            m('th.align-right', 'Posts'),
            vnode.state.isCompound ? m('th.align-right', 'Voting Power') : null,
            vnode.state.isCompound ? m('th.align-right', 'Delegate') : null,
          ]),
          vnode.state.membersLoaded.map((info) => {
            const profile = app.profiles.getProfile(info.chain, info.address);

            return m('tr', [
              m('td.members-item-info', [
                m('a', {
                    href: `/${app.activeId()}/account/${info.address}?base=${
                      info.chain
                    }`,
                  onclick: (e) => {
                    e.preventDefault();
                      localStorage[`${app.activeId()}-members-scrollY`] =
                        window.scrollY;
                    navigateToSubpage(`/account/${info.address}?base=${info.chain}`);
                  }
                }, [
                  m(User, { user: profile, showRole: true }),
                  vnode.state.voteEvents[info.address]
                  ? m(Tooltip, {
                      trigger: m(Tag, {
                      label: `${vnode.state.voteEvents[info.address].length} 
                      event${vnode.state.voteEvents[info.address].length !== 1 ? 's' : ''}`,
                      size: 'xs',
                    }),
                    content: vnode.state.voteEvents[info.address].map((o) => {
                      return m('div', `Proposal #${o.event_data.id}, 
                      ${o.event_data.support ? 'YES' : 'NO'}, ${o.event_data.votes} votes`);
                    })
                  }) : null)
              ]),
              m('td.align-right', [
                (info.count > 0) ? `${pluralize(info.count, 'post')} this month` : null,
              ]),
              vnode.state.isCompound
                ? m('td.align-right',
                  [ info.votes !== undefined ? `${info.votes.toNumber().toFixed(2)} ${app.chain.meta.chain.symbol}` : m(Spinner, { active: true, size: 'xs' }) ]) : null,
              vnode.state.isCompound ? m('td.align-right',
                m(Button, {
                  label: 'Delegate',
                  intent: 'primary',
                  onclick: async (e) => {
                    app.modals.create({ modal: DelegateModal, data: { address: info.address, name: profile.name, symbol: app.chain.meta.chain.symbol  } });
                  }
                })) : null,
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
