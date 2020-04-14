import { List, ListItem, Icon, Icons, PopoverMenu, MenuItem, MenuDivider, Button, Tag, Menu, MenuHeading } from 'construct-ui';
import Infinite from "mithril-infinite"
import { setActiveAccount } from 'controllers/app/login';
import LoginModal from 'views/modals/login_modal';

import 'components/navigation.scss';
import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import mixpanel from 'mixpanel-browser';

import { isMember } from 'views/components/membership_button';
import { ApiStatus, default as app } from 'state';
import { featherIcon, slugify, link } from 'helpers';
import { NotificationCategories } from 'types';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Edgeware from 'controllers/chain/edgeware/main';
import { ChainClass, ChainBase, Notification } from 'models';

import { jumpHighlightComment } from 'views/pages/view_proposal/jump_to_comment';
import QuillFormattedText, { sliceQuill } from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import ChainIcon from 'views/components/chain_icon';
import AccountBalance from 'views/components/widgets/account_balance';
import NewProposalButton from 'views/components/new_proposal_button';
import Login from 'views/components/login';
import User from 'views/components/widgets/user';
import ProfileBlock from 'views/components/widgets/profile_block';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import CreateCommunityModal from 'views/modals/create_community_modal';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import { OffchainCommunitiesStore } from 'stores';

const NotificationRow: m.Component<{ notification: Notification }> = {
  view: (vnode) => {
    const { notification } = vnode.attrs;
    const { category } = notification.subscription;

    // set up notificationTitle, notificationFrom, notificationExcerpt
    const getNotification = (userAccount, createdAt, title, excerpt, target: string, next?: Function) => {
      return m(ListItem, {
        class: notification.isRead ? '' : 'active',
        onclick: async () => {
          const notificationArray: Notification[] = [];
          notificationArray.push(notification);
          app.login.notifications.markAsRead(notificationArray).then(() => m.redraw());
          await m.route.set(target);
          m.redraw.sync();
          if (next) setTimeout(() => next(), 1);
        },
        contentLeft: [
        ],
        label: [
          m(User, { user: userAccount, avatarOnly: true, avatarSize: 24 }),
          m('.comment-body', [
            m('.comment-body-top', title),
            m('.comment-body-bottom', [
              m(User, { user: userAccount, hideAvatar: true }),
              m('span.created-at', createdAt.twitterShort()),
            ]),
            excerpt && m('.comment-body-excerpt', excerpt),
          ]),
        ]
      })
    };

    if (category === NotificationCategories.NewComment) {
      const { created_at, object_title, object_id, root_id, comment_text, comment_id, chain_id, community_id,
              author_address, author_chain } = JSON.parse(notification.data);
      if (!created_at || !object_title || (!object_id && !root_id) ||
          !comment_text || !comment_id || !author_address || !author_chain) return;

      // legacy comments use object_id, new comments use root_id
      const [ commented_type, commented_id ] = decodeURIComponent(object_id ? object_id : root_id).split('_');
      const commented_title = decodeURIComponent(object_title).trim();
      const decoded_comment_text = (() => {
        try {
          const doc = JSON.parse(decodeURIComponent(comment_text));
          return m(QuillFormattedText, { doc: sliceQuill(doc, 140), hideFormatting: true });
        } catch (e) {
          return m(MarkdownFormattedText, { doc: decodeURIComponent(comment_text).slice(0, 140), hideFormatting: true });;
        }
      })();

      return getNotification(
        [author_address, author_chain],
        moment.utc(created_at),
        m('span', [ 'New comment on ', m('span.commented-obj', commented_title) ]),
        decoded_comment_text,
        `/${community_id ? community_id : chain_id}/proposal/discussion/` +
          `${commented_id}?comment=${comment_id}`,
        () => jumpHighlightComment(comment_id));

    } else if (category === NotificationCategories.NewThread) {
      const { created_at, thread_title, thread_id, chain_id, community_id,
              author_address, author_chain } = JSON.parse(notification.data);
      if (!created_at || !thread_title || !thread_id || !author_address || !author_chain) return;

      const decoded_title = decodeURIComponent(thread_title);
      const community_name = community_id ?
        (app.config.communities.getById(community_id)?.name || 'Unknown community') :
        (app.config.chains.getById(chain_id)?.name || 'Unknown chain');

      return getNotification(
        [author_address, author_chain],
        moment.utc(created_at),
        m('span', [ 'New thread in ', m('span.commented-obj', community_name) ]),
        decoded_title,
        `/${community_id ? community_id : chain_id}/proposal/discussion/${thread_id}-` +
          `${slugify(decoded_title)}`,
        () => jumpHighlightComment('parent'));

    }
  },
};

const Navigation: m.Component<{}, {}> = {
  view: (vnode: m.VnodeDOM<{}, {}>) => {
    const nodes = app.config.nodes.getAll();
    const activeAccount = app.vm.activeAccount;
    const activeNode = app.chain && app.chain.meta;
    const selectedNodes = nodes.filter((n) => activeNode && n.url === activeNode.url &&
                                       n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    // chain menu
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      chains[n.chain.network] ? chains[n.chain.network].push(n) : chains[n.chain.network] = [n];
    });
    const myChains = Object.entries(chains).filter(([c, nodeList]) => isMember(c, null));
    const myCommunities = app.config.communities.getAll().filter((c) => isMember(null, c.id));

    // user menu
    const notifications = app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const unreadNotifications = notifications.filter((n) => !n.isRead).length; // TODO: display number of unread notifications

    // navigation menu
    const substrateGovernanceProposals = (app.chain && app.chain.base === ChainBase.Substrate) ?
      ((app.chain as Substrate).democracy.store.getAll().length +
       (app.chain as Substrate).democracyProposals.store.getAll().length +
       (app.chain as Substrate).council.store.getAll().length +
       (app.chain as Substrate).treasury.store.getAll().length) : 0;
    const edgewareSignalingProposals = (app.chain && app.chain.class === ChainClass.Edgeware) ?
      (app.chain as Edgeware).signaling.store.getAll().length : 0;
    const allSubstrateGovernanceProposals = substrateGovernanceProposals + edgewareSignalingProposals;
    const cosmosGovernanceProposals = (app.chain && app.chain.base === ChainBase.CosmosSDK) ?
      (app.chain as Cosmos).governance.store.getAll().length : 0;

    const hasProposals =
      app.chain && !app.community && [
        ChainBase.CosmosSDK, ChainBase.Substrate
      ].indexOf(app.chain.base) !== -1;

    const onDiscussionsPage = (p) =>
      (p === `/${app.activeId()}/` ||
       p.startsWith(`/${app.activeId()}/?`) ||
       p.startsWith(`/${app.activeId()}/proposal/discussion`) ||
       p.startsWith(`/${app.activeId()}/discussions`));
    const onChatPage = (p) => p.startsWith(`/${app.activeChainId()}/chat`);
    const onProposalPage = (p) =>
      (p.startsWith(`/${app.activeChainId()}/proposals`) ||
       p.startsWith(`/${app.activeChainId()}/signaling`) ||
       p.startsWith(`/${app.activeChainId()}/treasury`) ||
       p.startsWith(`/${app.activeChainId()}/proposal/referendum`) ||
       p.startsWith(`/${app.activeChainId()}/proposal/councilmotion`) ||
       p.startsWith(`/${app.activeChainId()}/proposal/democracyproposal`) ||
       p.startsWith(`/${app.activeChainId()}/proposal/signalingproposal`) ||
       p.startsWith(`/${app.activeChainId()}/proposal/treasuryproposal`));
    const onCouncilPage = (p) => p.startsWith(`/${app.activeChainId()}/council`);
    const onValidatorsPage = (p) => p.startsWith(`/${app.activeChainId()}/validators`);

    return m('.Navigation', {
      class: (app.isLoggedIn() ? 'logged-in' : 'logged-out') + ' ' +
        ((app.community || app.chain) ? 'active-community' : 'no-active-community'),
    }, [
      m(List, {
        interactive: true,
        size: 'lg',
      }, [
        // header
        m(ListItem, {
          class: 'title-selector',
          label: (app.community || app.chain) ?
            link('a.title-selector-link', `/${app.activeId()}/`, [
              m('.community-name', selectedNode ? selectedNode.chain.name : selectedCommunity ? selectedCommunity.meta.name : ''),
              !selectedNode && selectedCommunity && selectedCommunity.meta.privacyEnabled && m('span.icon-lock'),
              !selectedNode && selectedCommunity && !selectedCommunity.meta.privacyEnabled && m('span.icon-globe'),
              selectedNode && m(ChainStatusIndicator, { hideLabel: true }),
            ]) :
            link('a.title-selector-link', '/', 'Commonwealth'),
          contentRight: [
            // notifications menu
            app.isLoggedIn() && m(PopoverMenu, {
              transitionDuration: 50,
              hoverCloseDelay: 0,
              trigger: m(Button, {
                iconLeft: Icons.BELL,
                size: 'xs'
              }),
              position: 'bottom-end',
              closeOnContentClick: true,
              menuAttrs: {
                align: 'left',
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
            }),
            // invites menu
            app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, {
              iconLeft: Icons.MAIL,
              size: 'xs',
              onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
            }),
            // app.isLoggedIn() && m(PopoverMenu, {
            //   trigger: m(Button, {
            //     iconLeft: Icons.CHEVRON_DOWN,
            //     size: 'xs'
            //   }),
            //   position: 'bottom-end',
            //   closeOnContentClick: true,
            //   menuAttrs: {
            //     align: 'left',
            //   },
            //   content: [
            //     myChains.map(([chainID, nodeList]) => {
            //       return m(MenuItem, {
            //         label: nodeList[0].chain.name,
            //         onclick: () => m.route.set(`/${chainID}/`)
            //       });
            //     }),
            //     myCommunities.map((c) => {
            //       return m(MenuItem, {
            //         label: c.name,
            //         onclick: () => m.route.set(`/${c.id}/`)
            //       });
            //     }),
            //     m(MenuDivider),
            //     // new community
            //     app.login?.isSiteAdmin && m(MenuItem, {
            //       onclick: (e) => app.modals.create({ modal: CreateCommunityModal }),
            //       contentLeft: m(Icon, { name: Icons.PLUS }),
            //       label: 'New community'
            //     }),
            //   ]
            // }),
          ]
        }),
        app.isLoggedIn() && (app.community || app.chain) && m(ListItem, {
          class: 'action-selector',
          label: m(NewProposalButton, { fluid: true }),
        }),
        // discussions (all communities)
        (app.community || app.chain) &&
          m(ListItem, {
            active: onDiscussionsPage(m.route.get()),
            label: 'Discussions',
            onclick: (e) => m.route.set(`/${app.activeId()}/`),
          }),
        // // chat (all communities)
        // (app.community || app.chain) &&
        //   m(ListItem, {
        //     active: onChatPage(m.route.get()),
        //     label: 'Chat',
        //     onclick: (e) => m.route.set(`/${app.activeId()}/chat`),
        //   }),
        // governance (substrate and cosmos only)
        !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate) &&
          m('h4', 'On-chain'),
        // proposals (substrate and cosmos only)
        !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate) &&
          m(ListItem, {
            active: onProposalPage(m.route.get()),
            label: 'Proposals',
            onclick: (e) => m.route.set(`/${app.activeChainId()}/proposals`),
            contentRight: [
              allSubstrateGovernanceProposals > 0 && m(Tag, { rounded: true, label: allSubstrateGovernanceProposals }),
              cosmosGovernanceProposals > 0 && m(Tag, { rounded: true, label: cosmosGovernanceProposals }),
            ],
          }),
        // council (substrate only)
        !app.community && app.chain?.base === ChainBase.Substrate &&
          m(ListItem, {
            active: onCouncilPage(m.route.get()),
            label: 'Council',
            onclick: (e) => m.route.set(`/${app.activeChainId()}/council`),
            contentRight: [], // TODO
          }),
        // validators (substrate and cosmos only)
        // !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate) &&
        //   m(ListItem, {
        //     active: onValidatorsPage(m.route.get()),
        //     label: 'Validators',
        //     onclick: (e) => m.route.set(`/${app.activeChainId()}/validators`),
        //     contentLeft: m(Icon, { name: 'settings' }), // ?
        //   }),

        !app.isLoggedIn() ?
          m(ListItem, {
            class: 'login-selector',
            label: m('.login-selector-user', [
              m(Button, {
                intent: 'primary',
                iconLeft: Icons.USER,
                size: 'sm',
                fluid: true,
                label: 'Log in',
                onclick: () => app.modals.create({ modal: LoginModal }),
              }),
            ]),
          }) :
          m(ListItem, {
            class: 'login-selector',
            contentLeft: app.vm.activeAccount && [
              m(User, { user: app.vm.activeAccount, avatarOnly: true, avatarSize: 28, linkify: true }),
              m('.login-selector-user', [
                m('.user-info', [
                  m(User, { user: app.vm.activeAccount, hideAvatar: true, hideIdentityIcon: true }),
                  m('.user-address', app.vm.activeAccount.chain.id === 'near'
                    ? app.vm.activeAccount.address
                    : `${app.vm.activeAccount.address.slice(0, 6)}...`)
                ])
              ]),
            ],
            label: [
              app.login.activeAddresses.length === 0 ?
                // no address on the active chain
                m(Button, {
                  intent: 'none',
                  iconLeft: Icons.USER_PLUS,
                  size: 'sm',
                  fluid: true,
                  label: `Link new ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} address`,
                  onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
                }) :
                // at least one address on the active chain
                m(PopoverMenu, {
                  class: 'switch-user-button',
                  transitionDuration: 50,
                  hoverCloseDelay: 0,
                  trigger: app.vm.activeAccount ?
                    m(Button, {
                      iconRight: Icons.CHEVRON_UP,
                      size: 'xs'
                    }) :
                    m(Button, {
                      intent: 'none',
                      iconRight: Icons.CHEVRON_UP,
                      size: 'sm',
                      fluid: true,
                      label: `Select address`,
                    }),
                  position: 'bottom-end',
                  closeOnContentClick: true,
                  menuAttrs: {
                    align: 'left',
                  },
                  content: [
                    // link new address
                    m(MenuItem, {
                      onclick: () => {
                        app.modals.create({ modal: LinkNewAddressModal });
                      },
                      contentLeft: m(Icon, { name: Icons.USER_PLUS }),
                      label: `Link new ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} address`
                    }),
                    m(MenuDivider),
                    // existing addresses that have a Role in the community
                    app.login.activeAddresses
                      .filter((account) => isMember(app.chain?.meta.chain.id, app.community?.id, account))
                      .map((account) => m(MenuItem, {
                        key: `${account.chain.id}-${account.address}`,
                        disabled: account === activeAccount,
                        class: account === activeAccount ? 'selected' : '',
                        onclick: () => setActiveAccount(account),
                        label: [
                          m(User, { user: account }),
                        ],
                      })),
                  ],
                }),
            ],
          }),
      ]),
    ]);
  },
};

export default Navigation;
