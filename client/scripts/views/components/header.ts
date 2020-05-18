import 'components/header.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import Infinite from 'mithril-infinite';
import { Button, Icon, Icons, PopoverMenu, List, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';
import { initAppState } from 'app';

import { notifySuccess } from 'controllers/app/notifications';
import FeedbackModal from 'views/modals/feedback_modal';
import User from 'views/components/widgets/user';
import LoginModal from 'views/modals/login_modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';

import NewProposalButton from 'views/components/new_proposal_button';
import NotificationRow from 'views/components/sidebar/notification_row';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import EditProfileModal from 'views/modals/edit_profile_modal';
import EditIdentityModal from '../modals/edit_identity_modal';

const Header: m.Component<{}> = {
  view: (vnode) => {
    // user menu
    const notifications = app.login.notifications
      ? app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix()) : [];
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;

    return m('.Header', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'}`
    }, [
<<<<<<< HEAD
      m('.placeholder'),
      // new proposal
      m(NewProposalButton, { fluid: false }),
      // notifications menu
      app.isLoggedIn() && m(PopoverMenu, {
        transitionDuration: 0,
        hoverCloseDelay: 0,
        trigger: m(Button, {
          iconLeft: Icons.BELL,
        }),
        position: 'bottom-end',
        closeOnContentClick: true,
        menuAttrs: {
          align: 'left',
=======
      m('ul', [
        activeEntity && activeEntity.loaded && [
          activeAcct ? [
            m('li.account-menu-item.my-account', {
              onclick: (e) => {
                e.preventDefault();
                m.route.set(`/${activeAcct.chain.id}/account/${activeAcct.address}`);
              }
            }, [
              m(ProfileBlock, { account: activeAcct })
            ]),
            (activeAcct instanceof SubstrateAccount
              || activeAcct instanceof CosmosAccount
              || activeAcct instanceof NearAccount
              || activeAcct instanceof MolochMember
            )
            && m('li.account-balance-item', [
              m(AccountBalance, { account: activeAcct }),
            ]),
          ]
            : m('li.account-menu-item.my-account-setup-outer', {
              onclick: (e) => {
                e.preventDefault();
              }
            }, [
              m('.my-account-setup', [
                m('.account-setup-text', [
                  `Set up your ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} `,
                  'account to participate in discussions.'
                ]),
                m('a.btn.btn-block.formular-button-primary', {
                  onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
                }, 'Begin setup'),
              ]),
            ]),
          activeAcct && m('li.add-account-menu-item', {
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({ modal: AddressesModal });
            }
          }, [
            'Switch or add address',
            app.login.activeAddresses && app.login.activeAddresses.length > 1
              && m('.addresses-badge', app.login.activeAddresses.length),
          ]),
        ],
        m('li', {
          onclick: () => app.activeId() ? m.route.set(`/${app.activeId()}/settings`) : m.route.set('/settings')
        }, 'Settings'),
        // app.isLoggedIn() && m('li', {
        //   onclick: () => m.route.set('/subscriptions'),
        // }, 'Subscriptions'),
        app.login.isSiteAdmin && m('li', {
          onclick: () => {
            m.route.set(`/${
              app.activeId()
                         || (app.vm.activeAccount ? app.vm.activeAccount.chain.id : app.config.defaultChain)
            }/admin`);
          }
        }, 'Admin'),
        m('li.divider'),
        m('a', {
          href: '/logout',
          onclick: (e) => {
            e.preventDefault();
            $.get(`${app.serverUrl()}/logout`).then(async () => {
              await initAppState();
              notifySuccess('Logged out');
              m.route.set('/');
              m.redraw();
            }).catch((err) => {
              location.reload();
            });
            mixpanel.reset();
          },
        }, [
          m('li', 'Logout'),
        ]),
      ])
    ]);
  }
};

const ActionMenu : m.Component<IMenuAttrs> = {
  view: (vnode: m.VnodeDOM<IMenuAttrs>) => {
    const { menusOpen } = vnode.attrs;
    const activeAcct = app.vm.activeAccount;

    return m(NavigationMenu, {
      menusOpen,
      class: 'ActionMenu',
      selector: [ m('span.icon-plus'), m('span.action-caret', '▾') ],
    }, [
      m('ul', [
        app.activeId() && [
          //
          // new discussion
          //
          m('li', {
            onclick: () => { m.route.set(`/${app.activeId()}/new/thread`); }
          }, 'New discussion'),
          //
          //  new link
          //
          m('li', {
            onclick: () => { m.route.set(`/${app.activeId()}/new/link`); }
          }, 'New link post'),

          //
          // new proposal
          //
          (activeAcct instanceof CosmosAccount || activeAcct instanceof SubstrateAccount) && m('li.divider'),
          activeAcct instanceof CosmosAccount && m('li', {
            onclick: (e) => app.modals.create({
              modal: NewProposalModal,
              data: { typeEnum: ProposalType.CosmosProposal }
            })
          }, 'New proposal'),
          (activeAcct instanceof MolochMember) && m('li', {
            onclick: (e) => app.modals.create({
              modal: NewProposalModal,
              data: { typeEnum: ProposalType.MolochProposal }
            })
          }, 'New proposal'),
          (activeAcct instanceof MolochMember) && m('li.divider'),
          (activeAcct instanceof MolochMember) && m('li', {
            onclick: (e) => app.modals.create({
              modal: UpdateDelegateModal,
            })
          }, 'Update delegate key'),
          (activeAcct instanceof MolochMember) && m('li', {
            onclick: (e) => app.modals.create({
              modal: RagequitModal,
            })
          }, 'Rage quit'),
          (activeAcct instanceof MolochMember) && m('li', {
            onclick: (e) => app.modals.create({
              modal: TokenApprovalModal,
            })
          }, 'Approve tokens'),
          // TODO: add a "reserve tokens" option here, in case you want to apply to DAO?
          activeAcct instanceof SubstrateAccount && activeAcct.chainClass === ChainClass.Edgeware && m('li', {
            onclick: () => { m.route.set(`/${activeAcct.chain.id}/new/signaling`); }
          }, 'New signaling proposal'),
          activeAcct instanceof SubstrateAccount && m('li', {
            onclick: (e) => app.modals.create({
              modal: NewProposalModal,
              data: { typeEnum: ProposalType.SubstrateTreasuryProposal }
            })
          }, 'New treasury proposal'),
          activeAcct instanceof SubstrateAccount && m('li', {
            onclick: (e) => app.modals.create({
              modal: NewProposalModal,
              data: { typeEnum: ProposalType.SubstrateDemocracyProposal }
            })
          }, 'New democracy proposal'),
          activeAcct instanceof SubstrateAccount && m('li', {
            class: activeAcct.isCouncillor ? '' : 'disabled',
            onclick: (e) => app.modals.create({
              modal: NewProposalModal,
              data: { typeEnum: ProposalType.SubstrateCollectiveProposal }
            })
          }, 'New council motion'),
          m('li.divider'),
        ],
        //
        // new address or community
        //
        m('li', {
          onclick: (e) => app.modals.create({ modal: LinkNewAddressModal }),
        }, `Link new ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} address`),
        app.login && app.login.isSiteAdmin && m('li', {
          onclick: (e) => app.modals.create({ modal: CreateCommunityModal }),
        }, 'New community'),
      ])
    ]);
  }
};

interface IHeaderNotificationRow {
  notification: Notification;
}

const getCommentPreview = (comment_text) => {
  let decoded_comment_text;
  try {
    const doc = JSON.parse(decodeURIComponent(comment_text));
    decoded_comment_text = m(QuillFormattedText, { doc: sliceQuill(doc, 140) });
  } catch (e) {
    let doc = decodeURIComponent(comment_text);
    const regexp = RegExp('\\[(\\@.+?)\\]\\(.+?\\)', 'g');
    const matches = doc['matchAll'](regexp);
    Array.from(matches).forEach((match) => {
      doc = doc.replace(match[0], match[1]);
    });
    decoded_comment_text = m(MarkdownFormattedText, {
      doc: doc.slice(0, 140),
      hideFormatting: true
    });
  }
  return decoded_comment_text;
};

const getNotificationFields = (category, data: IPostNotificationData) => {
  const { created_at, root_id, root_title, root_type, comment_id, comment_text, parent_comment_id,
    parent_comment_text, chain_id, community_id, author_address, author_chain } = data;

  const community_name = community_id
    ? (app.config.communities.getById(community_id)?.name || 'Unknown community')
    : (app.config.chains.getById(chain_id)?.name || 'Unknown chain');

  let notificationHeader;
  let notificationBody;
  const decoded_title = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = getCommentPreview(comment_text);
  } else if (root_type === ProposalType.OffchainThread) {
    notificationBody = decoded_title;
  }

  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id
      ? m('span', [ 'New comment on ', m('span.commented-obj', decoded_title) ])
      : m('span', [ 'New response to your comment in ', m('span.commented_obj', decoded_title) ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [ 'New thread in ', m('span.commented-obj', community_name) ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = (!comment_id)
      ? m('span', ['New mention in ', m('span.commented-obj', community_name) ])
      : m('span', ['New mention in ', m('span.commented-obj', decoded_title || community_name) ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = (!comment_id)
      ? m('span', ['New reaction to ', m('span.commented-obj', decoded_title) ])
      : m('span', ['New reaction in ', m('span.commented-obj', decoded_title || community_name) ]);
  }
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
    community: community_id,
  };

  const args = comment_id ? [root_type, pseudoProposal, { id: comment_id }] : [root_type, pseudoProposal];
  const path = (getProposalUrl as any)(...args);
  const pageJump = comment_id ? () => jumpHighlightComment(comment_id) : () => jumpHighlightComment('parent');

  return ({
    author: [author_address, author_chain],
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump
  });
};

const HeaderNotificationRow: m.Component<IHeaderNotificationRow> = {
  view: (vnode) => {
    const { notification } = vnode.attrs;
    const { category } = notification.subscription;
    const getHeaderNotificationRow = (userAccount, createdAt, title, excerpt, target: string, next?: Function) => {
      return m('li.HeaderNotificationRow', {
        class: notification.isRead ? '' : 'active',
        onclick: async () => {
          const notificationArray: Notification[] = [];
          notificationArray.push(notification);
          app.login.notifications.markAsRead(notificationArray).then(() => m.redraw());
          await m.route.set(target);
          m.redraw.sync();
          if (next) setTimeout(() => next(), 1);
        },
      }, [
        m(User, { user: userAccount, avatarOnly: true, avatarSize: 36 }),
        m('.comment-body', [
          m('.comment-body-top', title),
          m('.comment-body-bottom', [
            m(User, { user: userAccount, hideAvatar: true }),
            m('span.created-at', createdAt.twitterShort()),
          ]),
          excerpt && m('.comment-body-excerpt', excerpt),
        ]),
      ]);
    };

    if (category === NotificationCategories.ChainEvent) {
      if (!notification.chainEvent) {
        throw new Error('chain event notification does not have expected data');
      }
      // TODO: use different labelers depending on chain
      const chainId = notification.chainEvent.type.chain;
      const chainName = app.config.chains.getById(chainId).name;
      const label = labelEdgewareEvent(
        notification.chainEvent.blockNumber,
        chainId,
        notification.chainEvent.data,
      );
      return m('li.HeaderNotificationRow', {
        class: notification.isRead ? '' : 'active',
        onclick: async () => {
          const notificationArray: Notification[] = [];
          notificationArray.push(notification);
          app.login.notifications.markAsRead(notificationArray).then(() => m.redraw());
          if (!label.linkUrl) return;
          await m.route.set(label.linkUrl);
          m.redraw.sync();
>>>>>>> master
        },
        class: 'notification-menu',
        content: m('.notification-list', [
          notifications.length > 0
            ? m(Infinite, {
              maxPages: 8,
              pageData: () => notifications,
              item: (data, opts, index) => m(NotificationRow, { notification: data }),
            })
            : m('li.no-notifications', 'No Notifications'),
        ]),
<<<<<<< HEAD
      }),
      // invites menu
      app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, {
        iconLeft: Icons.MAIL,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
      // logged out
      !app.isLoggedIn() && m(Button, {
        class: 'login-selector',
        intent: 'primary',
        iconLeft: Icons.USER,
        label: 'Log in',
        onclick: () => app.modals.create({ modal: LoginModal }),
      }),
      // logged in
      app.isLoggedIn() && m(PopoverMenu, {
        closeOnContentClick: true,
        transitionDuration: 0,
        hoverCloseDelay: 0,
        position: 'bottom-end',
        trigger: m(Button, {
          class: app.vm.activeAccount ? 'login-selector' : 'login-selector cui-button-icon',
          intent: 'none',
          label: app.vm.activeAccount
            ? m('.login-selector-user', [
              m(User, { user: app.vm.activeAccount, hideIdentityIcon: true }),
              m('.user-address', app.vm.activeAccount.chain.id === 'near'
                ? `@${app.vm.activeAccount.address}`
                : `${app.vm.activeAccount.address.slice(0, 6)}...`)
            ])
            : m(Icon, { name: Icons.CHEVRON_DOWN }),
        }),
        content: [
          app.vm.activeAccount
            && app.vm.activeAccount.chain
            && m.route.get() !== `/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`
            && [
              m(MenuItem, {
                label: 'Go to profile',
                iconLeft: Icons.USER,
                onclick: (e) => {
                  m.route.set(`/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`);
                },
              }),
              m(MenuDivider),
            ],
          m(MenuItem, {
            onclick: () => m.route.set('/settings'),
            iconLeft: Icons.SETTINGS,
            label: 'Settings'
          }),
          app.login?.isSiteAdmin && app.activeChainId() && m(MenuItem, {
            onclick: () => m.route.set(`/${app.activeChainId()}/admin`),
            iconLeft: Icons.USER,
            label: 'Admin'
          }),
          app.vm.activeAccount
          && m(MenuItem, {
            onclick: () => app.modals.create({
              modal: EditProfileModal,
              data: app.vm.activeAccount
            }),
            iconLeft: Icons.EDIT,
            label: 'Edit Profile'
          }),
          m(MenuItem, {
            onclick: async () => app.modals.create({
              modal: EditIdentityModal,
              data: { account: app.vm.activeAccount },
            }),
            iconLeft: Icons.LINK,
            label: 'Set on-chain ID'
          }),
          m(MenuItem, {
            onclick: () => app.modals.create({ modal: FeedbackModal }),
            iconLeft: Icons.SEND,
            label: 'Send feedback',
          }),
          m(MenuItem, {
            onclick: () => {
              $.get(`${app.serverUrl()}/logout`).then(async () => {
                await initAppState();
                notifySuccess('Logged out');
                m.route.set('/');
                m.redraw();
              }).catch((err) => {
                // eslint-disable-next-line no-restricted-globals
                location.reload();
              });
              mixpanel.reset();
=======
      ]);
    } else {
      const {
        author,
        createdAt,
        notificationHeader,
        notificationBody,
        path,
        pageJump
      } = getNotificationFields(
        category,
        typeof notification.data === 'string'
          ? JSON.parse(notification.data)
          : notification.data
      );

      return getHeaderNotificationRow(
        author,
        createdAt,
        notificationHeader,
        notificationBody,
        path,
        pageJump
      );
    }
  },
};


const InviteRow: m.Component<{ invites }> = {
  view: (vnode) => {
    const { invites } = vnode.attrs;
    if (invites.length === 0) return;

    return m('li.InviteRow', {
      onclick: (e) => {
        e.preventDefault();
        app.modals.create({ modal: ConfirmInviteModal });
      }
    }, [
      (invites.length > 2) ? [
        'New invite to ',
        m('strong', invites[0].community_name),
        ` and ${invites.length - 1} others`
      ] : (invites.length === 2) ? [
        'New invite to ',
        m('strong', invites[0].community_name),
        ' and 1 other',
      ] : [
        'New invite to ',
        m('strong', invites[0].community_name),
      ],
    ]);
  }
};

const Notifications: m.Component<{ notifications }> = {
  view: (vnode) => {
    const { notifications } = vnode.attrs;
    return m('ul.notification-list', [
      m(InviteRow, { invites: app.config.invites }),
      notifications.length > 0
        ? notifications.map((notification) => m(HeaderNotificationRow, { notification }))
        : (app.config.invites.length === 0) && m('li.no-notifications', 'No Notifications'),
      // m('li.divider'),
      // m('li', {
      //   onclick: () => {
      //     app.login.notifications.markAsRead(notifications);
      //     m.route.set(`/${app.activeId()}/notifications`);
      //   },
      // }, 'See All'),
    ]);
  },
};

const NotificationButtons: m.Component<{ notifications }> = {
  view: (vnode) => {
    const { notifications } = vnode.attrs;
    return m('.NotificationButtons', [
      m('.button', {
        class: notifications.length > 0 ? '' : 'disabled',
        onclick: (e) => {
          e.preventDefault();
          if (notifications.length < 1) return;
          app.login.notifications.markAsRead(notifications).then(() => m.redraw());
        }
      }, 'Mark All Read'),
      // m('.button', {
      //   onclick: (e) => {
      //     e.preventDefault();
      //     app.login.notifications.clearAllRead().then(() => m.redraw());
      //   }
      // }, 'Clear All Read'),
    ]);
  }
};

const NotificationMenu : m.Component<{ menusOpen }> = {
  view: (vnode) => {
    const { menusOpen } = vnode.attrs;
    const notifications = app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const invites = app.config.invites;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const unreadMessage = (invites.length > 0) ? [unreadCount, m('span.icon-mail')] : `${unreadCount}`;

    return m(NavigationMenu, {
      menusOpen,
      class: 'NotificationMenu',
      selector: m('.notification-count', {
        class: (unreadCount > 0 || invites.length > 0) ? 'unread-notifications' : '',
      }, unreadMessage),
    }, [
      notifications.length > 0 && m(NotificationButtons, { notifications }),
      m(Notifications, { notifications }),
    ]);
  }
};

interface IHeaderState {
  menusOpen: any;
}

const Header: m.Component<{}, IHeaderState> = {
  view: (vnode: m.VnodeDOM<{}, IHeaderState>) => {
    if (!vnode.state.menusOpen) vnode.state.menusOpen = [];
    const { menusOpen } = vnode.state;
    const nodes = app.config.nodes.getAll();
    const activeNode = app.chain && app.chain.meta;
    const selectedNodes = nodes.filter((n) => activeNode && n.url === activeNode.url
                                       && n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    return m('.Header', [
      m('.container', [
        m('.mobile-menu-toggle', {
          onclick: (e) => {
            e.preventDefault();
            $(vnode.dom).find('.Navigation').toggleClass('mobile-expanded');
          }
        }, featherIcon('menu', 18, 2, '#fff')),
        app.loginStatusLoaded() && [
          m('a.header-logo', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              $(e.target).trigger('menuclose');
              m.route.set(app.login.selectedNode
                ? `/${app.login.selectedNode.chain.id || app.login.selectedNode.chain}/`
                : '/'
              );
>>>>>>> master
            },
            iconLeft: Icons.X_SQUARE,
            label: 'Logout'
          }),
        ]
      }),
    ]);
  }
};

export default Header;
