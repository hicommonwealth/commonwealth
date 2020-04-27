import 'components/navigation/index.scss';

import {
  List, ListItem, Icon, Icons, PopoverMenu, MenuItem, MenuDivider,
  Button, Tag, Menu, MenuHeading, Drawer } from 'construct-ui';
import Infinite from 'mithril-infinite';
import { setActiveAccount } from 'controllers/app/login';
import LoginModal from 'views/modals/login_modal';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';

import { ApiStatus, default as app } from 'state';
import { featherIcon, link } from 'helpers';
import { ProposalType } from 'identifiers';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Edgeware from 'controllers/chain/edgeware/main';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { ChainClass, ChainBase, Notification } from 'models';
import { OffchainCommunitiesStore } from 'stores';

import CommunitySwitcher from 'views/components/community_switcher';
import { isMember } from 'views/components/membership_button';

import ChainIcon from 'views/components/chain_icon';
import AccountBalance from 'views/components/widgets/account_balance';
import NewProposalButton from 'views/components/new_proposal_button';
import Login from 'views/components/login';
import User from 'views/components/widgets/user';
import TagSelector from 'views/components/navigation/tag_selector';
import SubscriptionButton from 'views/components/navigation/subscription_button';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import CreateCommunityModal from 'views/modals/create_community_modal';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import NewProposalModal from 'views/modals/proposals';
import NotificationRow from 'views/components/navigation/notification_row';

// Moloch specific
import UpdateDelegateModal from 'views/modals/update_delegate_modal';
import RagequitModal from 'views/modals/ragequit_modal';
import TokenApprovalModal from 'views/modals/token_approval_modal';

import { getProposalUrl } from 'shared/utils';
import { IPostNotificationData, ICommunityNotificationData } from 'shared/types';

const Navigation: m.Component<{ activeTag: string }, { communitySwitcherVisible: boolean }> = {
  view: (vnode) => {
    const { activeTag } = vnode.attrs;
    const nodes = app.config.nodes.getAll();
    const activeAccount = app.vm.activeAccount;
    const activeNode = app.chain?.meta;
    const selectedNodes = nodes.filter((n) => activeNode && n.url === activeNode.url
                                       && n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    // chain menu
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.network]) {
        chains[n.chain.network].push(n);
      } else {
        chains[n.chain.network] = [n];
      }
    });
    const myChains = Object.entries(chains).filter(([c, nodeList]) => isMember(c, null));
    const myCommunities = app.config.communities.getAll().filter((c) => isMember(null, c.id));

    // user menu
    const notifications = app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    // TODO: display number of unread notifications

    // navigation menu
    const substrateGovernanceProposals = (app.chain?.base === ChainBase.Substrate)
      ? ((app.chain as Substrate).democracy.store.getAll().filter((p) => !p.completed && !p.passed).length
         + (app.chain as Substrate).democracyProposals.store.getAll().filter((p) => !p.completed).length
         + (app.chain as Substrate).council.store.getAll().filter((p) => !p.completed).length
         + (app.chain as Substrate).treasury.store.getAll().filter((p) => !p.completed).length) : 0;
    const edgewareSignalingProposals = (app.chain?.class === ChainClass.Edgeware)
      ? (app.chain as Edgeware).signaling.store.getAll().filter((p) => !p.completed).length : 0;
    const allSubstrateGovernanceProposals = substrateGovernanceProposals + edgewareSignalingProposals;
    const cosmosGovernanceProposals = (app.chain?.base === ChainBase.CosmosSDK)
      ? (app.chain as Cosmos).governance.store.getAll().filter((p) => !p.completed).length : 0;

    const hasProposals = app.chain && !app.community && (
      app.chain.base === ChainBase.CosmosSDK
        || app.chain.base === ChainBase.Substrate
        || app.chain.class === ChainClass.Moloch);
    const showMolochMenuOptions = app.chain?.class === ChainClass.Moloch;

    const onDiscussionsPage = (p) => (
      p === `/${app.activeId()}/`
        || p.startsWith(`/${app.activeId()}/?`)
        || p.startsWith(`/${app.activeId()}/proposal/discussion`)
        || p.startsWith(`/${app.activeId()}/discussions`));
    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`);
    const onTagsPage = (p) => p.startsWith(`/${app.activeId()}/tags`);
    const onChatPage = (p) => p.startsWith(`/${app.activeId()}/chat`);
    const onProposalPage = (p) => (
      p.startsWith(`/${app.activeChainId()}/proposals`)
        || p.startsWith(`/${app.activeChainId()}/signaling`)
        || p.startsWith(`/${app.activeChainId()}/treasury`)
        || p.startsWith(`/${app.activeChainId()}/proposal/referendum`)
        || p.startsWith(`/${app.activeChainId()}/proposal/councilmotion`)
        || p.startsWith(`/${app.activeChainId()}/proposal/democracyproposal`)
        || p.startsWith(`/${app.activeChainId()}/proposal/signalingproposal`)
        || p.startsWith(`/${app.activeChainId()}/proposal/treasuryproposal`));
    const onCouncilPage = (p) => p.startsWith(`/${app.activeChainId()}/council`);
    const onValidatorsPage = (p) => p.startsWith(`/${app.activeChainId()}/validators`);

    return m('.Navigation', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'} `
        + `${(app.community || app.chain) ? 'active-community' : 'no-active-community'}`,
    }, [
      m(Drawer, {
        isOpen: vnode.state.communitySwitcherVisible,
        autofocus: true,
        content: m(CommunitySwitcher),
        onClose: () => {
          vnode.state.communitySwitcherVisible = false;
        },
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
      }),
      m(List, {
        interactive: true,
        size: 'lg',
        class: 'cui-list-dark',
      }, [
        // header
        m(ListItem, {
          class: 'title-selector',
          onclick: () => {
            if (app.isLoggedIn()) {
              vnode.state.communitySwitcherVisible = true;
            } else {
              m.route.set('/');
            }
          },
          label: (app.community || app.chain) ? [
            m('.community-name', selectedNode
              ? selectedNode.chain.name
              : selectedCommunity ? selectedCommunity.meta.name : ''),
            !selectedNode && selectedCommunity && selectedCommunity.meta.privacyEnabled && m('span.icon-lock'),
            !selectedNode && selectedCommunity && !selectedCommunity.meta.privacyEnabled && m('span.icon-globe'),
            selectedNode && m(ChainStatusIndicator, { hideLabel: true }),
          ] : 'Commonwealth',
          contentRight: [
            // notifications menu
            app.isLoggedIn() && (app.community || app.chain)
              && m(SubscriptionButton),
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
        m('h4', 'Discussions'),
        (app.community || app.chain)
          && m(ListItem, {
            active: onDiscussionsPage(m.route.get()),
            label: 'All Discussions',
            onclick: (e) => m.route.set(`/${app.activeId()}/`),
            contentLeft: m(Icon, { name: Icons.TAG }),
          }),
        // TODO: tag selector
        (app.community || app.chain)
          && m(TagSelector, { activeTag, showFullListing: false }),
        // members (all communities)
        (app.community || app.chain)
          && m(ListItem, {
            active: onTagsPage(m.route.get()),
            label: 'Manage Tags',
            onclick: (e) => m.route.set(`/${app.activeId()}/tags/`),
            contentLeft: m(Icon, { name: Icons.SETTINGS }),
          }),
        (app.community || app.chain)
          && m(ListItem, {
            active: onMembersPage(m.route.get()),
            label: 'Members',
            onclick: (e) => m.route.set(`/${app.activeId()}/members/`),
            contentLeft: m(Icon, { name: Icons.USERS }),
          }),
        // // chat (all communities)
        // (app.community || app.chain) &&
        //   m(ListItem, {
        //     active: onChatPage(m.route.get()),
        //     label: 'Chat',
        //     onclick: (e) => m.route.set(`/${app.activeId()}/chat`),
        //   }),
        // governance (substrate and cosmos only)
        !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate)
          && m('h4', 'On-chain'),
        // proposals (substrate and cosmos only)
        !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate)
          && m(ListItem, {
            active: onProposalPage(m.route.get()),
            label: 'Proposals',
            onclick: (e) => m.route.set(`/${app.activeChainId()}/proposals`),
            contentLeft: m(Icon, { name: Icons.BOX }),
            contentRight: [
              allSubstrateGovernanceProposals > 0 && m(Tag, { rounded: true, label: allSubstrateGovernanceProposals }),
              cosmosGovernanceProposals > 0 && m(Tag, { rounded: true, label: cosmosGovernanceProposals }),
            ],
          }),
        // council (substrate only)
        !app.community && app.chain?.base === ChainBase.Substrate
          && m(ListItem, {
            active: onCouncilPage(m.route.get()),
            label: 'Council',
            onclick: (e) => m.route.set(`/${app.activeChainId()}/council`),
            contentLeft: m(Icon, { name: Icons.BOX }),
            contentRight: [], // TODO
          }),
        // validators (substrate and cosmos only)
        // !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate) &&
        //   m(ListItem, {
        //     active: onValidatorsPage(m.route.get()),
        //     label: 'Validators',
        //     onclick: (e) => m.route.set(`/${app.activeChainId()}/validators`),
        //     contentLeft: m(Icon, { name: Icons.BOX }),
        //   }),
        showMolochMenuOptions && m(ListItem, {
          onclick: (e) => app.modals.create({
            modal: NewProposalModal,
            data: { typeEnum: ProposalType.MolochProposal }
          }),
          label: 'New proposal'
        }),
        showMolochMenuOptions && m(ListItem, {
          onclick: (e) => app.modals.create({
            modal: UpdateDelegateModal,
          }),
          label: 'Update delegate key'
        }),
        showMolochMenuOptions && m(ListItem, {
          onclick: (e) => app.modals.create({
            modal: RagequitModal,
          }),
          label: 'Rage quit'
        }),
        showMolochMenuOptions && m(ListItem, {
          onclick: (e) => app.modals.create({
            modal: TokenApprovalModal,
          }),
          label: 'Approve tokens'
        }),
        // TODO: add a "reserve tokens" option here, to apply to DAO?

        !app.isLoggedIn()
          ? m(ListItem, {
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
          })
          : m(ListItem, {
            class: 'login-selector',
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              m.route.set(`/${app.vm.activeAccount.chain.id}/account/${app.vm.activeAccount.address}`);
            },
            label: app.vm.activeAccount ? [
              m(User, { user: app.vm.activeAccount, avatarOnly: true, avatarSize: 28, linkify: true }),
              m('.login-selector-user', [
                m('.user-info', [
                  m(User, { user: app.vm.activeAccount, hideAvatar: true, hideIdentityIcon: true }),
                  m('.user-address', app.vm.activeAccount.chain.id === 'near'
                    ? `@${app.vm.activeAccount.address}`
                    : `${app.vm.activeAccount.address.slice(0, 6)}...`)
                ])
              ]),
            ] : app.login.activeAddresses.length === 0 ? m(Button, {
              intent: 'none',
              iconLeft: Icons.USER_PLUS,
              size: 'sm',
              fluid: true,
              label: `Link new ${(app.chain?.chain?.denom) || ''} address`,
              onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
            }) : null,
          }),
      ]),
    ]);
  },
};

export default Navigation;
