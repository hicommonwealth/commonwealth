/* eslint-disable no-restricted-globals */
import 'components/header.scss';
import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import mixpanel from 'mixpanel-browser';
import BN from 'bn.js';

import { initAppState } from 'app';
import app, { ApiStatus } from 'state';
import { ProposalType } from 'identifiers';
import { featherIcon, slugify } from 'helpers';
import { NotificationCategories } from 'types';

import { formatCoin } from 'adapters/currency';
import labelEvent from 'events/edgeware/filters/labeler';

import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Edgeware from 'controllers/chain/edgeware/main';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { CosmosAccount } from 'controllers/chain/cosmos/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { NearAccount } from 'controllers/chain/near/account';
import { ChainClass, ChainBase, Notification, NotificationCategory } from 'models';
import { notifySuccess } from 'controllers/app/notifications';

import { jumpHighlightComment } from 'views/pages/view_proposal';
import QuillFormattedText, { sliceQuill } from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import ChainIcon from 'views/components/chain_icon';
import AccountBalance from 'views/components/widgets/account_balance';
import Login from 'views/components/login';
import User from 'views/components/widgets/user';
import ProfileBlock from 'views/components/widgets/profile_block';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import AddressesModal from 'views/modals/addresses_modal';
import NewProposalModal from 'views/modals/proposals';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import CreateCommunityModal from 'views/modals/create_community_modal';
import { OffchainCommunitiesStore } from 'stores';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import ManageChainNotificationsModal from 'views/modals/manage_chain_notifications_modal';

// Moloch specific
import UpdateDelegateModal from 'views/modals/update_delegate_modal';
import RagequitModal from 'views/modals/ragequit_modal';
import TokenApprovalModal from 'views/modals/token_approval_modal';


interface INavigationMenuAttrs {
  menusOpen: any;
  class: string;
  selector;
  closeDelay?;
  activeIf?;
}

interface INavigationMenuState {
  keepOpen: boolean;
}

//
// General purpose debounced menu. Works on desktop and mobile:
// mouseover or click to open, mouseleave or click to close.
//
// Clicking anywhere inside a NavigationMenu dropdown closes
// the menu. This can be prevented by catching 'click' events in the
// parent DOM element for your dropdown and calling e.stopPropagation().
//
// Forcing the menu closed is possible by emitting a 'menuclose' event.
//
const NavigationMenu : m.Component<INavigationMenuAttrs, INavigationMenuState> = {
  view: (vnode: m.VnodeDOM<INavigationMenuAttrs, INavigationMenuState>) => {
    const menusOpen = vnode.attrs.menusOpen;
    const menuOpenDelay = 75;
    const menuCloseDelay = vnode.attrs.closeDelay || 250;
    const menuClass = vnode.attrs.class;
    const menuSelector = vnode.attrs.selector;
    const isActive = vnode.attrs.activeIf && vnode.attrs.activeIf(m.route.get());

    return m('.NavigationMenu', {
      class: vnode.attrs.class + (isActive ? ' active' : ''),
      oncreate: (innerVnode: m.VnodeDOM) => {
        const debouncedCloseMenu = _.debounce((e) => {
          if (menusOpen.indexOf(menuClass) === -1) return;
          if (vnode.state.keepOpen) return; // keep open if another mouseenter event happened since the close trigger
          if (vnode.dom.contains(document.activeElement)) return; // or if the user focused an element in the menu
          menusOpen.splice(menusOpen.indexOf(menuClass), 1);
          m.redraw();
        }, menuCloseDelay);
        $(innerVnode.dom).on('mouseleave', () => { vnode.state.keepOpen = false; });
        $(innerVnode.dom).on('mouseleave', debouncedCloseMenu);
        $(innerVnode.dom).on('menuclose', () => {
          menusOpen.splice(menusOpen.indexOf(menuClass), 1);
          m.redraw();
        });
      },
      onremove: (innerVnode: m.VnodeDOM) => {
        $(innerVnode.dom).off('mouseleave click');
      },
    }, [
      m('.menu-selector', {
        class: (menusOpen.indexOf(menuClass) !== -1) ? 'active' : '',
        oncreate: (innerVnode: m.VnodeDOM) => {
          const debouncedOpenMenu = _.debounce((e) => {
            if (menusOpen.indexOf(menuClass) !== -1) return;
            menusOpen.splice(0);
            menusOpen.push(menuClass);
            m.redraw();
          }, menuOpenDelay);
          $(innerVnode.dom).on('mouseenter', () => { vnode.state.keepOpen = true; });
          $(innerVnode.dom).on('mouseenter', debouncedOpenMenu);
          $(innerVnode.dom).on('click', (e) => {
            // click toggles the menu open; also toggles the menu closed on mobile viewports
            e.stopPropagation();
            if (menusOpen.indexOf(menuClass) === -1) {
              vnode.state.keepOpen = true;
              menusOpen.splice(0);
              menusOpen.push(menuClass);
              m.redraw();
            } else if ($(window).width() <= 440) {
              vnode.state.keepOpen = false;
              menusOpen.splice(menusOpen.indexOf(menuClass), 1);
              m.redraw();
            }
          });
        },
        onremove: (innerVnode: m.VnodeDOM) => {
          $(innerVnode.dom).off('mouseenter');
        },
      }, menuSelector),
      m('.menu-dropdown', {
        class: (menusOpen.indexOf(menuClass) !== -1) ? 'open' : '',
        oncreate: (innerVnode) => {
          $(innerVnode.dom).on('mouseenter', () => { vnode.state.keepOpen = true; });
          $(innerVnode.dom).on('click', (e) => {
            if (menusOpen.indexOf(menuClass) === -1) return;
            vnode.state.keepOpen = false;
            menusOpen.splice(menusOpen.indexOf(menuClass), 1);
            m.redraw();
          });
        },
        onremove: (innerVnode: m.VnodeDOM) => {
          $(innerVnode.dom).off('mouseenter');
        },
      }, vnode.children),
    ]);
  }
};

interface INavigationItemAttrs {
  path;
  label;
  activeIf?;
  class?;
}

const NavigationItem: m.Component<INavigationItemAttrs> = {
  view: (vnode: m.VnodeDOM<INavigationItemAttrs>) => {
    const path = vnode.attrs.path;
    const label = vnode.attrs.label;
    const isActive = vnode.attrs.activeIf ? vnode.attrs.activeIf(m.route.get()) : m.route.get() === path;

    return m('a.NavigationItem', {
      class: vnode.attrs.class + (isActive ? ' active' : ''),
      href: path,
      onclick: (e) => {
        if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
        e.preventDefault();
        m.route.set(path);
        if ($(vnode.dom).closest('.Navigation').hasClass('mobile-expanded')) {
          $(vnode.dom).closest('.Navigation').removeClass('mobile-expanded');
        }
      },
    }, label);
  }
};

interface IMenuAttrs {
  menusOpen?: any;
  selectedNode: any;
  selectedCommunity?: any;
}

interface IChainSelectorState {
  expandedChain: string;
  expandedDrop: string;
  selIndex?: number;
  focused?: boolean;
  search?: string;
}

const Navigation: m.Component<IMenuAttrs> = {
  view: (vnode: m.VnodeDOM<IMenuAttrs>) => {
    const { menusOpen, selectedNode, selectedCommunity } = vnode.attrs;
    const defaultChainId = (app.activeChainId()) ? app.activeChainId()
      : app.activeCommunityId() ? app.community.meta.defaultChain.id : 'edgeware';

    const substrateGovernanceProposals = (app.chain && app.chain.base === ChainBase.Substrate) ?
      ((app.chain as Substrate).democracy.store.getAll().filter((p) => !p.completed).length
       + (app.chain as Substrate).democracyProposals.store.getAll().filter((p) => !p.completed).length
       + (app.chain as Substrate).council.store.getAll().filter((p) => !p.completed).length
       + (app.chain as Substrate).treasury.store.getAll().filter((p) => !p.completed).length) : 0;
    const edgewareSignalingProposals = (app.chain && app.chain.class === ChainClass.Edgeware)
      ? (app.chain as Edgeware).signaling.store.getAll().filter((p) => !p.completed).length : 0;
    const allSubstrateGovernanceProposals = substrateGovernanceProposals + edgewareSignalingProposals;
    const cosmosGovernanceProposals = (app.chain && app.chain.base === ChainBase.CosmosSDK)
      ? (app.chain as Cosmos).governance.store.getAll().filter((p) => !p.completed).length : 0;

    return m('.Navigation', ([].concat([
      m(NavigationItem, {
        label: 'Home',
        path: '/',
        class: 'home-nav',
        activeIf: (p) => p === '/'
      })
    ]).concat((selectedNode || selectedCommunity) ? [
      m(NavigationItem, {
        label: 'Discussions',
        path: `/${app.activeId()}/`,
        activeIf: (p) => p === `/${app.activeId()}/`
          || p.startsWith(`/${app.activeId()}/?`)
          || p.startsWith(`/${app.activeId()}/proposal/discussion`)
          || p.startsWith(`/${app.activeId()}/discussions`)
      }),
      // m(NavigationItem, {
      //   label: 'Questions',
      //   path: `/${app.activeId()}/questions`,
      //   activeIf: (p) =>
      //     p.startsWith(`/${app.activeId()}/proposal/questions`) ||
      //     p.startsWith(`/${app.activeId()}/questions`)
      // }),
      // m(NavigationItem, {
      //   label: 'Feature Requests',
      //   path: `/${app.activeId()}/requests`,
      //   activeIf: (p) =>
      //     p.startsWith(`/${app.activeId()}/proposal/requests`) ||
      //     p.startsWith(`/${app.activeId()}/request`)
      // }),
      (app.chain && !app.community)
        && ([ChainBase.CosmosSDK, ChainBase.Substrate].indexOf(app.chain.base) !== -1
        || app.chain.class === ChainClass.Moloch) && m(NavigationItem, {
        label: [
          'Proposals',
          allSubstrateGovernanceProposals > 0 && m('.header-count', allSubstrateGovernanceProposals),
          cosmosGovernanceProposals > 0 && m('.header-count', cosmosGovernanceProposals),
        ],
        path: `/${app.activeChainId()}/proposals`,
        activeIf: (p) => (p.startsWith(`/${app.activeChainId()}/proposals`)
                          || p.startsWith(`/${app.activeChainId()}/signaling`)
                          || p.startsWith(`/${app.activeChainId()}/treasury`)
                          || p.startsWith(`/${app.activeChainId()}/proposal/referendum`)
                          || p.startsWith(`/${app.activeChainId()}/proposal/councilmotion`)
                          || p.startsWith(`/${app.activeChainId()}/proposal/democracyproposal`)
                          || p.startsWith(`/${app.activeChainId()}/proposal/signalingproposal`)
                          || p.startsWith(`/${app.activeChainId()}/proposal/treasuryproposal`))
      }),
      //
      app.chain && app.chain.base === ChainBase.Substrate && m(NavigationItem, {
        label: 'Council',
        path: `/${app.activeChainId()}/council`,
        activeIf: (p) => p.startsWith(`/${app.activeChainId()}/council`),
      }, 'Council'),
      //
      // Validators page
      //
      // app.chain && !app.community && [
      //   ChainBase.CosmosSDK, ChainBase.Substrate
      // ].indexOf(app.chain.base) !== -1 && m(NavigationItem, {
      //   label: [ 'Validators', m('.header-beta', 'alpha') ],
      //   path: `/${app.activeChainId()}/validators`,
      //   activeIf: (p) => p.startsWith(`/${app.activeChainId()}/validators`),
      // }),
    ] : [])));
  }
};

const ChainLabel : m.Component<{ selectedNode, selectedCommunity }> = {
  view: (vnode) => {
    const selectedNode = vnode.attrs.selectedNode;
    const selectedCommunity = vnode.attrs.selectedCommunity;

    return m('.ChainLabel', [
      app.chain
        && m(ChainIcon, { chain: app.chain.meta.chain }),
      selectedNode ? selectedNode.chain.name
        : selectedCommunity ? selectedCommunity.meta.name : 'Commonwealth',
      !selectedNode && selectedCommunity && selectedCommunity.meta.privacyEnabled && m('span.icon-lock'),
      selectedNode && m(ChainStatusIndicator, { hideLabel: true }),
    ]);
  }
};

const AccountMenu : m.Component<IMenuAttrs> = {
  view: (vnode: m.VnodeDOM<IMenuAttrs>) => {
    // TODO: show the bare minimum of account menu items when the page is loaded without a chain
    // (login, settings, logout)
    const { menusOpen, selectedNode } = vnode.attrs;
    const activeAcct = app.vm.activeAccount;

    const activeEntity = app.community ? app.community : app.chain;

    return m(NavigationMenu, {
      menusOpen,
      class: 'AccountMenu',
      selector: !activeEntity ? [
        // logged in, no chain
        m('.no-chain-or-community-carat', m('span.icon-down-open')),
      ] : !activeEntity.loaded ? [
        // logged in, has chain, chain is loading
        m('span.loading-spinner', [
          m('span.icon-spinner1.animate-spin'),
        ]),
        app.chain && (app.chain.networkStatus === ApiStatus.Disconnected
          ? m('span.loading-text', ' Connecting...')
          : m('span.loading-text', ' Loading chain...'))
      ] : !activeAcct ? [
        // logged in, has chain, account is loading
        m('a.setup-address-button', [
          m('span.desktop-text', 'Setup required'),
          m('span.mobile-text', 'Setup'),
        ]),
      ] : [
        // logged in, has chain, fully loaded
        m(User, { user: activeAcct })
      ]
    }, [
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

const decodeComment = (comment_text) => {
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

const getNotificationFields = (category, data) => {
  const { created_at, object_title, object_id, root_id, comment_text, comment_id, chain_id, community_id,
    author_address, author_chain, thread_title, thread_id, mention_context } = JSON.parse(data);
  if (mention_context) category += `-${mention_context}`;
  const linksToComment = (category === NotificationCategories.NewComment || category === 'new-mention-comment');
  const linksToThread = (category === NotificationCategories.NewThread || category === 'new-mention-thread');
  if (!linksToComment && !linksToThread) {
    console.error('Missing or invalid notification category.');
    return;
  }
  if (!created_at || !author_address || !author_chain) {
    console.error('Notification data is incomplete.');
    return;
  }

  const community_name = community_id
    ? (app.config.communities.getById(community_id)?.name || 'Unknown community')
    : (app.config.chains.getById(chain_id)?.name || 'Unknown chain');

  let notificationHeader;
  let notificationBody;
  let commented_type;
  let commented_id;
  let decoded_title;

  if (thread_title) decoded_title = decodeURIComponent(thread_title);
  if (category === NotificationCategories.NewComment) {
    if (!object_title || (!object_id && !root_id) || !comment_text || !comment_id) {
      console.error('Notification data is incomplete.');
      return;
    }
    // legacy comments use object_id, new comments use root_id
    [ commented_type, commented_id ] = decodeURIComponent(object_id || root_id).split('_');
    const commented_title = decodeURIComponent(object_title).trim();
    const decoded_comment_text = decodeComment(comment_text);
    notificationHeader = m('span', [ 'New comment on ', m('span.commented-obj', commented_title) ]);
    notificationBody = decoded_comment_text;
  } else if (category === NotificationCategories.NewThread) {
    if (!decoded_title || !thread_id) {
      console.error('Notification data is incomplete.');
      return;
    }
    notificationHeader = m('span', [ 'New thread in ', m('span.commented-obj', community_name) ]);
    notificationBody = decoded_title;
  } else if (category === 'new-mention-thread') {
    if (!decoded_title || !thread_id) {
      console.error('Notification data is incomplete.');
      return;
    }
    notificationBody = decoded_title;
    notificationHeader = m('span', [ 'New mention in ', m('span.commented-obj', community_name) ]);
  } else if (category === 'new-mention-comment') {
    if (!comment_text || !comment_id) {
      console.error('Notification data is incomplete.');
      return;
    }
    const decoded_comment_text = decodeComment(comment_text);
    notificationBody = decoded_comment_text;
    notificationHeader = m('span', [
      'New mention in ', m('span.commented-obj', decoded_title.trim() || community_name)
    ]);
  }

  const path = linksToComment
    ? `/${community_id || chain_id}/proposal/discussion/${commented_id || thread_id}?comment=${comment_id}`
    : `/${community_id || chain_id}/proposal/discussion/${thread_id}-${slugify(decoded_title)}`;
  const pageJump = linksToComment ? () => jumpHighlightComment(comment_id) : () => jumpHighlightComment('parent');

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

    if (category === NotificationCategories.NewComment) {
      const { created_at, object_title, object_id, root_id, comment_text, comment_id, chain_id, community_id,
        author_address, author_chain } = JSON.parse(notification.data);
      if (!created_at || !object_title || (!object_id && !root_id)
          || !comment_text || !comment_id || !author_address || !author_chain) return;

      // legacy comments use object_id, new comments use root_id
      const [ commented_type, commented_id ] = decodeURIComponent(object_id || root_id).split('_');
      const commented_title = decodeURIComponent(object_title).trim();
      const decoded_comment_text = (() => {
        try {
          const doc = JSON.parse(decodeURIComponent(comment_text));
          return m(QuillFormattedText, {
            doc: sliceQuill(doc, 140),
            hideFormatting: true
          });
        } catch (e) {
          return m(MarkdownFormattedText, {
            doc: decodeURIComponent(comment_text).slice(0, 140),
            hideFormatting: true
          });
        }
      })();
      return getHeaderNotificationRow(
        [author_address, author_chain],
        moment.utc(created_at),
        m('span', [ 'New comment on ', m('span.commented-obj', commented_title) ]),
        decoded_comment_text,
        `/${community_id || chain_id}/proposal/discussion/`
        + `${commented_id}?comment=${comment_id}`,
        () => jumpHighlightComment(comment_id)
      );
    } else if (category === NotificationCategories.NewThread) {
      const { created_at, thread_title, thread_id, chain_id, community_id,
        author_address, author_chain } = JSON.parse(notification.data);
      if (!created_at || !thread_title || !thread_id || !author_address || !author_chain) return;

      const decoded_title = decodeURIComponent(thread_title);
      const community_name = community_id
        ? (app.config.communities.getById(community_id)?.name || 'Unknown community')
        : (app.config.chains.getById(chain_id)?.name || 'Unknown chain');

      return getHeaderNotificationRow(
        [author_address, author_chain],
        moment.utc(created_at),
        m('span', [ 'New thread in ', m('span.commented-obj', community_name) ]),
        decoded_title,
        `/${community_id || chain_id}/proposal/discussion/${thread_id}-`
          + `${slugify(decoded_title)}`,
        () => jumpHighlightComment('parent')
      );
    } else if (category === NotificationCategories.ChainEvent) {
      // TODO: this needs to be improved a lot lol
      if (!notification.chainEvent) {
        throw new Error('chain event notification does not have expected data');
      }
      const label = labelEvent(
        notification.chainEvent.blockNumber,
        notification.chainEvent.data,
        (bal) => formatCoin(app.chain.chain.coins(new BN(bal, 10)), true),
      );
      return m('li.HeaderNotificationRow', {
        class: notification.isRead ? '' : 'active',
        onclick: async () => {
          if (!label.linkUrl) return;
          const notificationArray: Notification[] = [];
          notificationArray.push(notification);
          app.login.notifications.markAsRead(notificationArray).then(() => m.redraw());
          await m.route.set(label.linkUrl);
          m.redraw.sync();
        },
      }, [
        m('.comment-body', [
          m('.comment-body-top', label.heading),
          m('.comment-body-bottom', `Block ${notification.chainEvent.blockNumber}`),
          m('.comment-body-excerpt', label.label),
        ]),
      ]);
    }

    const {
      author,
      createdAt,
      notificationHeader,
      notificationBody,
      path,
      pageJump
    } = getNotificationFields(category, notification.data);

    return getHeaderNotificationRow(
      author,
      createdAt,
      notificationHeader,
      notificationBody,
      path,
      pageJump
    );

    // else if (category === NotificationCategories.NewCommunity) {
    //   //const { created_at, proposal_id } = JSON.parse(notification.data);
    //   //const thread = app.threads.store.getByIdentifier(proposal_id);
    //   const community = app.activeId();

    //   return getHeaderNotificationRow(
    //     moment.utc(created_at),
    //     null,
    //     `New community created`,
    //     '',
    //     `/${community}/`);
    // }
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
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({
            modal: ManageChainNotificationsModal,
          });
        }
      }, 'Manage Chain Notifications'),
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
      m(NotificationButtons, { notifications }),
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
              m.route.set(app.login.selectedNode ? `/${app.login.selectedNode.chain.id}/` : '/');
            },
          }, [
            m('.header-logo-image')
          ]),
          (selectedNode || selectedCommunity) && m(ChainLabel, { selectedNode, selectedCommunity }),
          m(Navigation, { menusOpen, selectedNode, selectedCommunity }),
          !app.isLoggedIn()
            ? m(NavigationMenu, {
              menusOpen,
              class: 'LoginMenu',
              selector: m('div', 'Login'),
              closeDelay: 350,
            }, m('.login-menu-wrapper', m(Login)))
            : m(AccountMenu, { menusOpen, selectedNode, selectedCommunity }),
          app.isLoggedIn() && m(NotificationMenu, { menusOpen }),
          app.isLoggedIn() && m(ActionMenu, { menusOpen, selectedNode, selectedCommunity }),
        ],
        m('.clear'),
      ]),
    ]);
  },
};

export default Header;
