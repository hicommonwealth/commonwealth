import 'components/sidebar/index.scss';

import LoginModal from 'views/modals/login_modal';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';
import {
  List, ListItem, Icon, Icons, PopoverMenu, MenuItem, MenuDivider,
  SelectList, Button, Tag, Menu, MenuHeading, Popover
} from 'construct-ui';

import { ApiStatus, default as app } from 'state';
import { featherIcon, link } from 'helpers';
import { ProposalType } from 'identifiers';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Edgeware from 'controllers/chain/edgeware/main';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { setActiveAccount } from 'controllers/app/login';
import { ChainClass, ChainBase, Notification, ChainInfo, CommunityInfo } from 'models';
import { OffchainCommunitiesStore } from 'stores';

import { isMember } from 'views/components/membership_button';
import ChainIcon from 'views/components/chain_icon';
import AccountBalance from 'views/components/widgets/account_balance';
import Login from 'views/components/login';
import User from 'views/components/widgets/user';
import TagSelector from 'views/components/sidebar/tag_selector';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import CreateCommunityModal from 'views/modals/create_community_modal';
import SelectAddressModal from 'views/modals/select_address_modal';
import NewProposalPage from 'views/pages/new_proposal/index';
import SubscriptionButton from 'views/components/sidebar/subscription_button';

// Moloch specific
import UpdateDelegateModal from 'views/modals/update_delegate_modal';
import RagequitModal from 'views/modals/ragequit_modal';
import TokenApprovalModal from 'views/modals/token_approval_modal';

import { getProposalUrl } from 'shared/utils';
import { IPostNotificationData, ICommunityNotificationData } from 'shared/types';
import { isRoleOfCommunity } from 'helpers/roles';
import AdminPanel from '../admin_panel';

const Sidebar: m.Component<{ activeTag: string }, {}> = {
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

    // sidebar menu
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

    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`;
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

    const selectableCommunities = (app.config.communities.getAll() as (CommunityInfo | ChainInfo)[])
      .concat(app.config.chains.getAll())
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((item) => {
        // only show chains with nodes
        return (item instanceof ChainInfo)
          ? app.config.nodes.getByChain(item.id)?.length
          : true;
      });

    const currentIndex = selectableCommunities.findIndex((item) => {
      return item instanceof ChainInfo
        ? app.activeChainId() === item.id
        : item instanceof CommunityInfo
          ? app.activeCommunityId() === item.id
          : null;
    });

    return m('.Sidebar', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'} `
        + `${(app.community || app.chain) ? 'active-community' : 'no-active-community'}`,
    }, [
      m('.SidebarMenu', [
        m(List, {
          interactive: true,
          size: 'lg',
        }, [
          // header
          m('.title-selector', [
            m(SelectList, {
              closeOnSelect: true,
              class: 'CommunitySelectList',
              activeIndex: currentIndex,
              items: selectableCommunities,
              itemRender: (item) => {
                return item instanceof ChainInfo
                  ? m(ListItem, { label: item.name, selected: app.activeChainId() === item.id })
                  : item instanceof CommunityInfo
                    ? m(ListItem, { label: item.name, selected: app.activeCommunityId() === item.id })
                    : null;
              },
              onSelect: (item: any) => {
                m.route.set(`/${item.id}`);
              },
              filterable: false,
              checkmark: false,
              popoverAttrs: {
                hasArrow: false
              },
              trigger: m(Button, {
                align: 'left',
                basic: true,
                compact: true,
                iconRight: Icons.CHEVRON_DOWN,
                label: (app.community || app.chain) ? [
                  m('span.community-name', selectedNode
                    ? selectedNode.chain.name
                    : selectedCommunity ? selectedCommunity.meta.name : ''),
                  !selectedNode && selectedCommunity && selectedCommunity.meta.privacyEnabled && m('span.icon-lock'),
                  !selectedNode && selectedCommunity && !selectedCommunity.meta.privacyEnabled && m('span.icon-globe'),
                  selectedNode && m(ChainStatusIndicator, { hideLabel: true }),
                ] : m('span.community-name', 'Select a community'),
                style: 'min-width: 200px',
              }),
            }),
            //   app.isLoggedIn() && (app.community || app.chain)
            //     && m(SubscriptionButton),
          ]),
          // community homepage
          (app.community || app.chain)
            && m(ListItem, {
              contentLeft: m(Icon, { name: Icons.HOME }),
              active: onDiscussionsPage(m.route.get()),
              label: 'Latest Activity',
              onclick: (e) => m.route.set(`/${app.activeId()}`),
            }),
          // discussions (all communities)
          (app.community || app.chain)
            && m('h4', 'Discussions'),
          (app.community || app.chain)
            && m(TagSelector, { activeTag, showFullListing: false, hideEditButton: true }),
          // proposals (substrate and cosmos only)
          (app.community || app.chain)
            && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate
                || showMolochMenuOptions)
            && m('h4', 'On-chain Voting'),
          !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate)
            && m(ListItem, {
              contentLeft: m(Icon, { name: Icons.GIT_PULL_REQUEST }),
              active: onProposalPage(m.route.get()),
              label: 'Proposals',
              onclick: (e) => m.route.set(`/${app.activeChainId()}/proposals`),
              contentRight: [
                allSubstrateGovernanceProposals > 0
                  && m(Tag, { rounded: true, label: allSubstrateGovernanceProposals }),
                cosmosGovernanceProposals > 0 && m(Tag, { rounded: true, label: cosmosGovernanceProposals }),
              ],
            }),
          // council (substrate only)
          !app.community && app.chain?.base === ChainBase.Substrate
            && m(ListItem, {
              contentLeft: m(Icon, { name: Icons.TRELLO }),
              active: onCouncilPage(m.route.get()),
              label: 'Council',
              onclick: (e) => m.route.set(`/${app.activeChainId()}/council`),
              contentRight: [], // TODO
            }),
          // validators (substrate and cosmos only)
          // !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate) &&
          //   m(ListItem, {
          //     contentLeft: m(Icon, { name: Icons.SHARE_2 }),
          //     active: onValidatorsPage(m.route.get()),
          //     label: 'Validators',
          //     onclick: (e) => m.route.set(`/${app.activeChainId()}/validators`),
          //   }),
          showMolochMenuOptions && m(ListItem, {
            onclick: (e) => {
              m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.MolochProposal });
            },
            label: 'New proposal',
            contentLeft: m(Icon, { name: Icons.FILE_PLUS }),
          }),
          showMolochMenuOptions && m(ListItem, {
            onclick: (e) => app.modals.create({
              modal: UpdateDelegateModal,
            }),
            label: 'Update delegate key',
            contentLeft: m(Icon, { name: Icons.KEY }),
          }),
          showMolochMenuOptions && m(ListItem, {
            onclick: (e) => app.modals.create({
              modal: RagequitModal,
            }),
            label: 'Rage quit',
            contentLeft: m(Icon, { name: Icons.FILE_MINUS }),
          }),
          showMolochMenuOptions && m(ListItem, {
            onclick: (e) => app.modals.create({
              modal: TokenApprovalModal,
            }),
            label: 'Approve tokens',
            contentLeft: m(Icon, { name: Icons.POWER }),
          }),
          (app.community || app.chain)
            && m('h4', 'More'),
          (app.community || app.chain)
            && m(ListItem, {
              active: onMembersPage(m.route.get()),
              label: 'Members',
              onclick: (e) => m.route.set(`/${app.activeId()}/members/`),
              contentLeft: m(Icon, { name: Icons.USERS }),
            }),
          isRoleOfCommunity(app.vm.activeAccount, app.login.addresses, app.login.roles, 'admin', app.activeId())
            && (app.community || app.chain)
            && m(AdminPanel),
          // login selector
          !app.isLoggedIn()
          // if logged out
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
          // if logged in
            : m(ListItem, {
              class: 'login-selector',
              label: app.vm.activeAccount
              // if address selected
                ? [
                  m(User, { user: app.vm.activeAccount, avatarOnly: true, avatarSize: 28, linkify: true }),
                  m('.login-selector-user', [
                    m('.user-info', [
                      m(User, { user: app.vm.activeAccount, hideAvatar: true, hideIdentityIcon: true }),
                      m('.user-address', app.vm.activeAccount.chain.id === 'near'
                        ? `@${app.vm.activeAccount.address}`
                        : `${app.vm.activeAccount.address.slice(0, 6)}...`)
                    ])
                  ]),
                ]
              // if no address is selected
                : app.login.activeAddresses.length === 0 ? m(Button, {
                  intent: 'none',
                  iconLeft: Icons.USER_PLUS,
                  size: 'sm',
                  fluid: true,
                  label: `Link new ${(app.chain?.chain?.denom) || ''} address`,
                  onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
                })
              // if addresses are available, but none is selected
                : m(Button, {
                  label: 'Select an address',
                  fluid: true,
                  onclick: () => app.modals.create({ modal: SelectAddressModal }),
                }),
            }),
        ]),
        // // chat (all communities)
        // (app.community || app.chain) &&
        //   m(ListItem, {
        //     active: onChatPage(m.route.get()),
        //     label: 'Chat',
        //     onclick: (e) => m.route.set(`/${app.activeId()}/chat`),
        //   }),
      ]),
    ]);
  },
};

export default Sidebar;
