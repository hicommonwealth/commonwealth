import 'components/sidebar/index.scss';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';
import {
  List, ListItem, Icon, Icons, PopoverMenu, MenuItem, MenuDivider,
  SelectList, Button, ButtonGroup, Tag, Menu, MenuHeading, Popover
} from 'construct-ui';

import app, { ApiStatus } from 'state';
import { featherIcon, link, pluralize } from 'helpers';
import { getProposalUrl } from 'shared/utils';
import { IPostNotificationData, ICommunityNotificationData } from 'shared/types';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase, Notification, ChainInfo, CommunityInfo } from 'models';
import { OffchainCommunitiesStore } from 'stores';

import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Edgeware from 'controllers/chain/edgeware/main';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { setActiveAccount } from 'controllers/app/login';

import { getSelectableCommunities } from 'views/components/header/community_selector';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import AdminPanel from 'views/components/admin_panel';
import AccountBalance from 'views/components/widgets/account_balance';
import Login from 'views/components/login';
import CreateCommunityModal from 'views/modals/create_community_modal';
import NewProposalPage from 'views/pages/new_proposal/index';
import SubscriptionButton from 'views/components/sidebar/subscription_button';

// Moloch specific
import UpdateDelegateModal from 'views/modals/update_delegate_modal';
import RagequitModal from 'views/modals/ragequit_modal';
import TokenManagementModal from 'views/modals/token_management_modal';
import Moloch from 'client/scripts/controllers/chain/ethereum/moloch/adapter';

const TagListings: m.Component<{}, { showMore: boolean }> = {
  view: (vnode) => {
    const featuredTags = {};
    const otherTags = {};
    const featuredTagIds = app.community?.meta?.featuredTags || app.chain?.meta?.chain?.featuredTags;

    const getTagRow = (name, id) => m(ListItem, {
      key: id,
      contentLeft: m(Icon, { name: Icons.HASH }),
      label: name.toLowerCase(),
      selected: m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name)}`,
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeId()}/discussions/${name}`);
      },
    });

    app.tags.getByCommunity(app.activeId()).forEach((tag) => {
      const { id, name } = tag;
      if (featuredTagIds.includes(`${tag.id}`)) {
        featuredTags[tag.name] = { id, name, featured_order: featuredTagIds.indexOf(`${id}`) };
      } else {
        otherTags[tag.name] = { id, name };
      }
    });
    const otherTagListing = Object.keys(otherTags)
      .sort((a, b) => otherTags[a].name.localeCompare(otherTags[b].name))
      .map((name, idx) => getTagRow(name, otherTags[name].id));
    const featuredTagListing = Object.keys(featuredTags)
      .sort((a, b) => Number(featuredTags[a].featured_order) - Number(featuredTags[b].featured_order))
      .map((name, idx) => getTagRow(name, featuredTags[name].id));

    return [
      m(List, featuredTagListing),
      otherTagListing.length > 0 && [
        vnode.state.showMore && m(List, { class: 'more-tags-list' }, otherTagListing),
        m(ListItem, {
          class: 'more-tags-toggle',
          label: vnode.state.showMore ? 'Show less' : pluralize(otherTagListing.length, 'more tag'),
          onclick: () => {
            vnode.state.showMore = !vnode.state.showMore;
          },
        }),
      ],
    ];
  }
};

const Sidebar: m.Component<{ activeTag: string }, {}> = {
  view: (vnode) => {
    const { activeTag } = vnode.attrs;
    const activeAccount = app.user.activeAccount;

    // chain menu
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.network]) {
        chains[n.chain.network].push(n);
      } else {
        chains[n.chain.network] = [n];
      }
    });
    const myChains = Object.entries(chains).filter(([c, nodeList]) => app.user.isMember({
      chain: c,
      account: app.user.activeAccount,
    }));
    const myCommunities = app.config.communities.getAll().filter((c) => app.user.isMember({
      community: c.id,
      account: app.user.activeAccount,
    }));

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
    const molochProposals = (app.chain?.class === ChainClass.Moloch)
      ? (app.chain as Moloch).governance.store.getAll().filter((p) => !p.completed).length : 0;


    const hasProposals = app.chain && !app.community && (
      app.chain.base === ChainBase.CosmosSDK
        || app.chain.base === ChainBase.Substrate
        || app.chain.class === ChainClass.Moloch);
    const showMolochMenuOptions = activeAccount && app.chain?.class === ChainClass.Moloch;
    const showMolochMemberOptions = showMolochMenuOptions && (activeAccount as MolochMember)?.shares?.gtn(0);

    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`;
    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`);
    const onTagsPage = (p) => p.startsWith(`/${app.activeId()}/tags`);
    const onChatPage = (p) => p.startsWith(`/${app.activeId()}/chat`);
    const onNotificationsPage = (p) => p.startsWith('/notifications');
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
    if (onNotificationsPage(m.route.get())) return;

    return m('.Sidebar', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'} `
        + `${(app.community || app.chain) ? 'active-community' : 'no-active-community'}`,
    }, (!app.community && !app.chain) ? [
      // no community
      m(List, { interactive: true }, [
        m('h4', 'Commonwealth'),
        app.isLoggedIn() && getSelectableCommunities().map((c: CommunityInfo | ChainInfo) => {
          return m(ListItem, {
            label: c.name,
            onclick: (e) => m.route.set(`/${c.id}`),
          });
        }),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.VOLUME_2, }),
          label: 'Notification Settings',
          onclick: (e) => m.route.set('/notification-settings'),
        }),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.USER, }),
          label: 'User Settings',
          onclick: (e) => m.route.set('/settings'),
        }),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.CHEVRONS_LEFT }),
          label: 'Back to home',
          onclick: (e) => m.route.set('/'),
        }),
      ]),
    ] : [
      // discussions
      m(List, { interactive: true }, [
        m('h4', 'Discuss'),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.HOME }),
          active: onDiscussionsPage(m.route.get()),
          label: 'Home',
          onclick: (e) => m.route.set(`/${app.activeId()}`),
        }),
        m(TagListings),
      ]),
      // proposals
      hasProposals
        && m(List, { interactive: true }, [
          m('h4', 'Vote & Stake'),
          // proposals (substrate, cosmos, moloch only)
          m(ListItem, {
            active: onProposalPage(m.route.get()),
            label: 'Proposals',
            onclick: (e) => m.route.set(`/${app.activeChainId()}/proposals`),
            contentRight: [
              allSubstrateGovernanceProposals > 0
                && m(Tag, { rounded: true, label: allSubstrateGovernanceProposals }),
              cosmosGovernanceProposals > 0 && m(Tag, { rounded: true, label: cosmosGovernanceProposals }),
              molochProposals > 0 && m(Tag, { rounded: true, label: molochProposals }),
            ],
          }),
          // council (substrate only)
          !app.community && app.chain?.base === ChainBase.Substrate
            && m(ListItem, {
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
          showMolochMemberOptions && m(ListItem, {
            onclick: (e) => {
              m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.MolochProposal });
            },
            label: 'New proposal',
            contentLeft: m(Icon, { name: Icons.FILE_PLUS }),
          }),
          showMolochMemberOptions && m(ListItem, {
            onclick: (e) => app.modals.create({
              modal: UpdateDelegateModal,
              data: {
                account: activeAccount as MolochMember,
                delegateKey: (activeAccount as MolochMember).delegateKey,
              },
            }),
            label: 'Update delegate key',
            contentLeft: m(Icon, { name: Icons.KEY }),
          }),
          showMolochMemberOptions && m(ListItem, {
            onclick: (e) => app.modals.create({
              modal: RagequitModal,
              data: { account: activeAccount as MolochMember },
            }),
            label: 'Rage quit',
            contentLeft: m(Icon, { name: Icons.FILE_MINUS }),
          }),
          showMolochMenuOptions && m(ListItem, {
            onclick: (e) => app.modals.create({
              modal: TokenManagementModal,
              data: {
                account: activeAccount as MolochMember,
                accounts: ((activeAccount as MolochMember).app.chain as Moloch).ethAccounts,
                contractAddress: ((activeAccount as MolochMember).app.chain as Moloch).governance.api.contractAddress,
                tokenAddress: ((activeAccount as MolochMember).app.chain as Moloch).governance.api.tokenContract.address,
              }
            }),
            label: 'Approve tokens',
            contentLeft: m(Icon, { name: Icons.POWER }),
          }),
        ]),
      // manage
      m(List, { interactive: true }, [
        m('h4', 'Manage'),
        m(ListItem, {
          active: onMembersPage(m.route.get()),
          label: 'Members',
          onclick: (e) => m.route.set(`/${app.activeId()}/members/`),
        }),
        m(ListItem, {
          class: 'TagRow',
          active: m.route.get() === `/${app.activeId()}/tags/`,
          label: 'Tags',
          onclick: (e) => m.route.set(`/${app.activeId()}/tags/`),
        }),
        app.user.isRoleOfCommunity({
          role: 'admin',
          chain: app.activeChainId(),
          community: app.activeCommunityId()
        }) && m(AdminPanel),
      ]),
      // // chat (all communities)
      // m(ListItem, {
      //   active: onChatPage(m.route.get()),
      //   label: 'Chat',
      //   onclick: (e) => m.route.set(`/${app.activeId()}/chat`),
      // }),
    ]);
  },
};

export default Sidebar;
