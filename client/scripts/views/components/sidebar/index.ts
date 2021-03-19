import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import dragula from 'dragula';
import {
  Button, Popover, PopoverMenu, MenuItem, Icon, Icons, Tag, Spinner, Select
} from 'construct-ui';

import { selectNode, initChain } from 'app';

import app, { ApiStatus } from 'state';
import { ProposalType } from 'identifiers';
import { link, removeUrlPrefix } from 'helpers';
import { ChainClass, ChainBase, ChainNetwork, ChainInfo, CommunityInfo, AddressInfo, NodeInfo } from 'models';
import NewTopicModal from 'views/modals/new_topic_modal';

import SubscriptionButton from 'views/components/subscription_button';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import CommunitySelector from 'views/components/sidebar/community_selector';

const SidebarQuickSwitcherItem: m.Component<{ item, size }> = {
  view: (vnode) => {
    const { item, size } = vnode.attrs;

    return m('.SidebarQuickSwitcherItem', {
      key: `${item instanceof ChainInfo ? 'chain' : 'community'}-${item.id}`
    }, [
      m('.quick-switcher-option', {
        class: (item instanceof ChainInfo && item.id === app?.chain?.meta?.chain?.id)
          || (item instanceof CommunityInfo && item.id === app?.community?.id)
          ? ' active' : '',
      }, item instanceof ChainInfo
        ? m(ChainIcon, {
          size,
          chain: item,
          onclick: link ? (() => m.route.set(`/${item.id}`)) : null
        }) : item instanceof CommunityInfo
          ? m(CommunityIcon, {
            size,
            community: item,
            onclick: link ? (() => m.route.set(`/${item.id}`)) : null
          }) : null),
    ]);
  }
};

const SidebarQuickSwitcher: m.Component<{}> = {
  view: (vnode) => {
    const allCommunities = (app.config.communities.getAll() as (CommunityInfo | ChainInfo)[])
      .concat(app.config.chains.getAll())
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((item) => (item instanceof ChainInfo)
        ? app.config.nodes.getByChain(item.id)?.length > 0
        : true); // only chains with nodes

    const starredCommunities = allCommunities.filter((item) => {
      // filter out non-starred communities
      if (item instanceof ChainInfo && !app.communities.isStarred(item.id, null)) return false;
      if (item instanceof CommunityInfo && !app.communities.isStarred(null, item.id)) return false;
      return true;
    });

    const size = 36;
    return m('.SidebarQuickSwitcher', [
      m(Button, {
        class: 'sidebar-home-link',
        rounded: true,
        label: m(Icon, { name: Icons.HOME }),
        onclick: (e) => {
          e.preventDefault();
          m.route.set('/');
        },
      }),
      m(CommunitySelector),
      starredCommunities.map((item) => m(SidebarQuickSwitcherItem, { item, size })),
    ]);
  }
};

export const OffchainNavigationModule: m.Component<{}, { dragulaInitialized: true }> = {
  view: (vnode) => {
    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`
      || p.startsWith(`/${app.activeId()}/discussions/`)
      || p.startsWith(`/${app.activeId()}/proposal/discussion/`)
      || p.startsWith(`/${app.activeId()}?`);
    const onSearchPage = (p) => p.startsWith(`/${app.activeId()}/search`);
    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`)
      || p.startsWith(`/${app.activeId()}/account/`);
    const onChatPage = (p) => p === `/${app.activeId()}/chat`;

    return m('.OffchainNavigationModule.SidebarModule', [
      // m('.section-header', 'Discuss'),
      m(Button, {
        rounded: true,
        fluid: true,
        active: onDiscussionsPage(m.route.get())
          && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
        label: 'Discussions',
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${app.activeId()}`);
        },
        contentLeft: m(Icon, { name: Icons.MESSAGE_CIRCLE }),
      }),
      m(Button, {
        rounded: true,
        fluid: true,
        active: onSearchPage(m.route.get())
          && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
        label: 'Search',
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${app.activeId()}/search`);
        },
        contentLeft: m(Icon, { name: Icons.SEARCH }),
      }),
      m(Button, {
        rounded: true,
        fluid: true,
        active: onMembersPage(m.route.get())
          && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
        label: 'Members',
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${app.activeId()}/members`);
        },
        contentLeft: m(Icon, { name: Icons.USERS }),
      }),
      // m(Button, {
      //   rounded: true,
      //   fluid: true,
      //   active: onChatPage(m.route.get()),
      //   label: 'Chat',
      //   onclick: (e) => {
      //     e.preventDefault();
      //     m.route.set(`/${app.activeId()}/chat`);
      //   },
      //   contentLeft: m(Icon, { name: Icons.MESSAGE_CIRCLE }),
      // }),
    ]);
  }
};

export const OnchainNavigationModule: m.Component<{}, {}> = {
  view: (vnode) => {
    // // proposal counts
    // const substrateGovernanceProposals = (app.chain?.loaded && app.chain?.base === ChainBase.Substrate)
    //   ? ((app.chain as any).democracy.store.getAll().filter((p) => !p.completed && !p.passed).length
    //     + (app.chain as any).democracyProposals.store.getAll().filter((p) => !p.completed).length
    //     + (app.chain as any).council.store.getAll().filter((p) => !p.completed).length
    //     + (app.chain as any).treasury.store.getAll().filter((p) => !p.completed).length) : 0;
    // const allSubstrateGovernanceProposals = substrateGovernanceProposals;
    // const cosmosGovernanceProposals = (app.chain?.loaded && app.chain?.base === ChainBase.CosmosSDK)
    //   ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;
    // const molochProposals = (app.chain?.loaded && app.chain?.class === ChainClass.Moloch)
    //   ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;

    const hasProposals = app.chain && !app.community && (
      app.chain.base === ChainBase.CosmosSDK
        || (app.chain.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Plasm)
        || app.chain.class === ChainClass.Moloch
        || app.chain.network === ChainNetwork.Marlin
        || app.chain.network === ChainNetwork.MarlinTestnet
        || app.chain.class === ChainClass.Commonwealth);
    if (!hasProposals) return;

    const showMolochMenuOptions = app.user.activeAccount && app.chain?.class === ChainClass.Moloch;
    const showMolochMemberOptions = showMolochMenuOptions && (app.user.activeAccount as any)?.shares?.gtn(0);
    const showCommonwealthMenuOptions = app.chain?.class === ChainClass.Commonwealth;

    const showMarlinOptions = app.user.activeAccount && app.chain?.network === ChainNetwork.Marlin;

    const onProposalPage = (p) => (
      p.startsWith(`/${app.activeChainId()}/proposals`)
        || p.startsWith(`/${app.activeChainId()}/proposal/councilmotion`)
        || p.startsWith(`/${app.activeChainId()}/proposal/democracyproposal`));
    const onReferendaPage = (p) => p.startsWith(`/${app.activeChainId()}/referenda`)
      || p.startsWith(`/${app.activeChainId()}/proposal/referendum`);
    const onTreasuryPage = (p) => p.startsWith(`/${app.activeChainId()}/treasury`)
      || p.startsWith(`/${app.activeChainId()}/proposal/treasuryproposal`);
    const onCouncilPage = (p) => p.startsWith(`/${app.activeChainId()}/council`);

    const onValidatorsPage = (p) => p.startsWith(`/${app.activeChainId()}/validators`);
    const onNotificationsPage = (p) => p.startsWith('/notifications');
    if (onNotificationsPage(m.route.get())) return;

    return m('.OnchainNavigationModule.SidebarModule', [
      m('.sidebar-spacer'),
      // referenda (substrate only)
      !app.community && app.chain?.base === ChainBase.Substrate
        && app.chain.network !== ChainNetwork.Darwinia
        && app.chain.network !== ChainNetwork.HydraDX
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onReferendaPage(m.route.get()),
          label: 'Referenda',
          contentLeft: m(Icon, { name: Icons.CHECK_SQUARE }),
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeChainId()}/referenda`);
          },
          contentRight: [], // TODO
        }),
      // proposals (substrate, cosmos, moloch & marlin only)
      !app.community && ((app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Darwinia)
                         || app.chain?.base === ChainBase.CosmosSDK
                         || app.chain?.class === ChainClass.Moloch
                         || app.chain?.network === ChainNetwork.Marlin
                         || app.chain?.network === ChainNetwork.MarlinTestnet)
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onProposalPage(m.route.get()),
          label: 'Proposals',
          contentLeft: m(Icon, { name: Icons.SEND }),
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeChainId()}/proposals`);
          },
        }),
      // treasury (substrate only)
      !app.community && app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Centrifuge
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onTreasuryPage(m.route.get()),
          label: 'Treasury',
          contentLeft: m(Icon, { name: Icons.TRUCK }),
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeChainId()}/treasury`);
          },
        }),
      m('.sidebar-spacer'),
      // council (substrate only)
      !app.community && app.chain?.base === ChainBase.Substrate
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onCouncilPage(m.route.get()),
          label: 'Council',
          contentLeft: m(Icon, { name: Icons.AWARD }),
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeChainId()}/council`);
          },
        }),
      // validators (substrate only)
      !app.community && app.chain?.base === ChainBase.Substrate
        && m(Button, {
          fluid: true,
          rounded: true,
          contentLeft: m(Icon, { name: Icons.SHARE_2 }),
          active: onValidatorsPage(m.route.get()),
          label: 'Validators',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeChainId()}/validators`);
          },
        }),
      showMarlinOptions && m(Button, {
        fluid: true,
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.MarlinProposal });
        },
        label: 'Submit Proposal',
        active: m.route.get() === `/${app.activeChainId()}/new/proposal/${ProposalType.MarlinProposal}`,
      }),
      showMarlinOptions && m(Button, {
        fluid: true,
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${app.activeChainId()}/delegate`);
        },
        label: 'Delegate',
        active: m.route.get() === `/${app.activeChainId()}/delegate`,
      }),
      showMolochMemberOptions && m(Button, {
        fluid: true,
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.MolochProposal });
        },
        label: 'New proposal',
        contentLeft: m(Icon, { name: Icons.FILE_PLUS }),
      }),
      showMolochMemberOptions && m(Button, {
        fluid: true,
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          app.modals.lazyCreate('update_delegate_modal', {
            account: app.user.activeAccount,
            delegateKey: (app.user.activeAccount as any).delegateKey,
          });
        },
        label: 'Update delegate key',
        contentLeft: m(Icon, { name: Icons.KEY }),
      }),
      showMolochMemberOptions && m(Button, {
        fluid: true,
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          app.modals.lazyCreate('ragequit_modal', { account: app.user.activeAccount });
        },
        label: 'Rage quit',
        contentLeft: m(Icon, { name: Icons.FILE_MINUS }),
      }),
      showMolochMenuOptions && m(Button, {
        fluid: true,
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          app.modals.lazyCreate('token_management_modal', {
            account: app.user.activeAccount,
            accounts: ((app.user.activeAccount as any).app.chain as any).ethAccounts,
            contractAddress: ((app.user.activeAccount as any).app.chain as any).governance.api.contractAddress,
            tokenAddress: ((app.user.activeAccount as any).app.chain as any).governance.api.tokenContract.address,
          });
        },
        label: 'Approve tokens',
        contentLeft: m(Icon, { name: Icons.POWER }),
      }),
      showCommonwealthMenuOptions && m(Button, {
        fluid: true,
        rounded: true,
        label: 'Projects',
        active: m.route.get().startsWith(`/${app.activeChainId()}/projects`),
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${app.activeChainId()}/projects`);
        },
      }),
      // showCommonwealthMenuOptions && m(Button, {
      //   fluid: true,
      //   rounded: true,
      //   label: 'Backers',
      //   active: m.route.get().startsWith(`/${app.activeChainId()}/backers`),
      //   onclick: (e) => {
      //     e.preventDefault();
      //     m.route.set(`/${app.activeChainId()}/backers`);
      //   },
      // }),
      showCommonwealthMenuOptions && m(Button, {
        fluid: true,
        rounded: true,
        label: 'Collectives',
        active: m.route.get().startsWith(`/${app.activeChainId()}/collectives`),
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${app.activeChainId()}/collectives`);
        },
      }),
    ]);
  }
};

export const ChainStatusModule: m.Component<{}, { initializing: boolean }> = {
  view: (vnode) => {
    const url = app.chain?.meta?.url;
    if (!url) return;

    const formatUrl = (u) => u
      .replace('ws://', '')
      .replace('wss://', '')
      .replace('http://', '')
      .replace('https://', '')
      .split('/')[0]
      .split(':')[0];

    const nodes = (app.chain && app.chain.meta ? [] : [{
      name: 'node',
      label: 'Select a node',
      value: undefined,
      selected: true,
      chainId: undefined,
    }]).concat(app.config.nodes.getAll().map((n) => ({
      name: 'node',
      label: formatUrl(n.url),
      value: n.id,
      selected: app.chain && app.chain.meta && n.url === app.chain.meta.url && n.chain === app.chain.meta.chain,
      chainId: n.chain.id,
    })));

    return m('.ChainStatusModule', [
      app.chain.deferred ? m(Button, {
        label: 'Connect to chain',
        rounded: true,
        fluid: true,
        disabled: vnode.state.initializing,
        onclick: async (e) => {
          e.preventDefault();
          vnode.state.initializing = true;
          await initChain();
          vnode.state.initializing = false;
          m.redraw();
        }
      }) : m(PopoverMenu, {
        transitionDuration: 0,
        closeOnContentClick: true,
        closeOnOutsideClick: true,
        content: nodes.filter((node) => node.chainId === app.activeChainId()).map((node) => {
          return m(MenuItem, {
            label: [
              node.label,
              app.chain?.meta.id === node.value && ' (Selected)',
            ],
            onclick: async (e) => {
              e.preventDefault();
              vnode.state.initializing = true;
              const n: NodeInfo = app.config.nodes.getById(node.value);
              if (!n) return;
              const finalizeInitialization = await selectNode(n);
              if (finalizeInitialization) await initChain();
              vnode.state.initializing = false;
              m.redraw();
            }
          });
        }),
        trigger: m(Button, {
          rounded: true,
          class: 'chain-status-main',
          fluid: true,
          disabled: vnode.state.initializing,
          label: vnode.state.initializing ? 'Connecting...' : app.chain.deferred
            ? 'Connect to chain' : m(ChainStatusIndicator),
        }),
      }),
    ]);
  }
};

export const ExternalLinksModule: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain && !app.community) return;
    const meta = app.chain ? app.chain.meta.chain : app.community.meta;
    const { name, description, website, discord, element, telegram, github } = meta;
    if (!website && !discord && !telegram && !github) return;

    return m('.ExternalLinksModule.SidebarModule', [
      m('.section-header', 'External Links'),
      discord && m(Button, {
        fluid: true,
        rounded: true,
        onclick: () => window.open(discord),
        label: 'Discord',
        iconRight: Icons.EXTERNAL_LINK,
        class: 'discord-button',
      }),
      element && m(Button, {
        fluid: true,
        rounded: true,
        onclick: () => window.open(element),
        label: 'Element',
        iconRight: Icons.EXTERNAL_LINK,
        class: 'element-button',
      }),
      telegram && m(Button, {
        fluid: true,
        rounded: true,
        onclick: () => window.open(telegram),
        label: 'Telegram',
        iconRight: Icons.EXTERNAL_LINK,
        class: 'telegram-button',
      }),
      (github || website) && m(PopoverMenu, {
        closeOnContentClick: true,
        transitionDuration: 0,
        inline: true,
        content: [
          github && m(MenuItem, {
            label: 'Github',
            onclick: () => window.open(github),
          }),
          website && m(MenuItem, {
            onclick: () => window.open(website),
            label: 'Project homepage',
          }),
        ],
        trigger: m(Button, {
          fluid: true,
          rounded: true,
          label: 'More...',
        }),
      }),
    ]);
  }
};

const Sidebar: m.Component<{}, {}> = {
  view: (vnode) => {
    return [
      m(SidebarQuickSwitcher),
      m('.Sidebar', [
        (app.chain || app.community) && m(OffchainNavigationModule),
        (app.chain || app.community) && m(OnchainNavigationModule),
        (app.chain || app.community) && m(ExternalLinksModule),
        m('br'),
        app.isLoggedIn() && (app.chain || app.community) && m(SubscriptionButton),
        app.chain && m(ChainStatusModule),
      ])
    ];
  },
};

export default Sidebar;
