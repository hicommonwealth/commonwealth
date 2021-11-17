import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import {
  Button, PopoverMenu, MenuItem, Icon, Icons, Tooltip
} from 'construct-ui';

import { selectNode, initChain, navigateToSubpage } from 'app';
import app from 'state';
import { ProposalType, ChainBase, ChainNetwork } from 'types';
import { link } from 'helpers';
import { ChainInfo, CommunityInfo, NodeInfo } from 'models';

import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import SubscriptionButton from 'views/components/subscription_button';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import CommunitySelector from 'views/components/sidebar/community_selector';
import CreateCommunityModal from 'views/modals/create_community_modal';

import { DiscordIcon, TelegramIcon, ElementIcon, GithubIcon, WebsiteIcon } from '../component_kit/icons';

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
      m('.community-nav-bar', [
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
        app.isLoggedIn() && m(Button, {
          class: 'create-community',
          rounded: true,
          label: m(Icon, { name: Icons.PLUS }),
          onclick: (e) => {
            app.modals.create({ modal: CreateCommunityModal });
          },
        }),
      ]),
      m('.scrollable-community-bar', [
        starredCommunities.map((item) => m(SidebarQuickSwitcherItem, { item, size })),
      ]),
    ]);
  }
};

export const OffchainNavigationModule: m.Component<{}, { dragulaInitialized: true }> = {
  view: (vnode) => {
    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`
      || p.startsWith(`/${app.activeId()}/discussions/`)
      || p.startsWith(`/${app.activeId()}/proposal/discussion/`)
      || p.startsWith(`/${app.activeId()}?`);
    const onFeaturedDiscussionPage = (p, f) => p === `/${app.activeId()}/discussions/${f}`
      || p === `/${app.activeId()}/discussions/${f}/`;
    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`)
      || p.startsWith(`/${app.activeId()}/account/`);

    const topics = app.topics.getByCommunity(app.activeId()).map(({ id, name, featuredInSidebar }) => {
      return { id, name, featuredInSidebar };
    }).filter((t) => t.featuredInSidebar).sort((a, b) => a.name.localeCompare(b.name));

    const discussionsLabel = (['vesuvius', 'olympus'].includes(app.activeId())) ? 'Forums' : 'Discussions';

    return m('.OffchainNavigationModule.SidebarModule', [
      // m('.section-header', 'Discuss'),
      m(Button, {
        rounded: true,
        fluid: true,
        active: onDiscussionsPage(m.route.get())
          && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
        label: discussionsLabel,
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage('/');
        },
      }),
      topics.map((t) => (
        m(Button, {
          fluid: true,
          rounded: true,
          active: onFeaturedDiscussionPage(m.route.get(), t.name),
          label: t.name,
          class: 'sub-button',
          onclick: (e) => {
            e.preventDefault();
            navigateToSubpage(`/discussions/${t.name}`);
          },
        })
      )),
      // m(Button, {
      //   rounded: true,
      //   fluid: true,
      //   active: onSearchPage(m.route.get())
      //     && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
      //   label: 'Search',
      //   onclick: (e) => {
      //     e.preventDefault();
      //     navigateToSubpage('/search');
      //   },
      // }),
      m(Button, {
        rounded: true,
        fluid: true,
        active: onMembersPage(m.route.get())
          && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
        label: 'Members',
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage('/members');
        },
      }),
      // m(Button, {
      //   rounded: true,
      //   fluid: true,
      //   active: onChatPage(m.route.get()),
      //   label: 'Chat',
      //   onclick: (e) => {
      //     e.preventDefault();
      //     navigateToSubpage('/chat');
      //   },
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
    // const molochProposals = (app.chain?.loaded && app.chain?.network === ChainNetwork.Moloch)
    //   ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;

    const hasProposals = app.chain && !app.community && (
      app.chain.base === ChainBase.CosmosSDK
        || app.chain.network === ChainNetwork.Sputnik
        || (app.chain.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Plasm)
        || app.chain.network === ChainNetwork.Moloch
        || app.chain.network === ChainNetwork.Compound
        || app.chain.network === ChainNetwork.Aave
        || app.chain.network === ChainNetwork.Commonwealth
        || app.chain.meta.chain.snapshot);
    if (!hasProposals) return;

    const showMolochMenuOptions = app.user.activeAccount && app.chain?.network === ChainNetwork.Moloch;
    const showMolochMemberOptions = showMolochMenuOptions && (app.user.activeAccount as any)?.shares?.gtn(0);
    const showCommonwealthMenuOptions = app.chain?.network === ChainNetwork.Commonwealth;

    const showCompoundOptions = app.user.activeAccount && app.chain?.network === ChainNetwork.Compound;
    const showAaveOptions = app.user.activeAccount && app.chain?.network === ChainNetwork.Aave;

    const onSnapshotProposal = (p) => p.startsWith(`/${app.activeId()}/snapshot`);
    const onSnapshotProposalCreation = (p) => p.startsWith(`/${app.activeId()}/new/snapshot/`);

    const onProposalPage = (p) => (
      p.startsWith(`/${app.activeChainId()}/proposals`)
        || p.startsWith(`/${app.activeChainId()}/proposal/${ProposalType.SubstrateDemocracyProposal}`));
    const onReferendaPage = (p) => p.startsWith(`/${app.activeChainId()}/referenda`)
      || p.startsWith(`/${app.activeChainId()}/proposal/${ProposalType.SubstrateDemocracyReferendum}`);

    const onTreasuryPage = (p) => p.startsWith(`/${app.activeChainId()}/treasury`)
      || p.startsWith(`/${app.activeChainId()}/proposal/${ProposalType.SubstrateTreasuryProposal}`);
    const onBountiesPage = (p) => p.startsWith(`/${app.activeChainId()}/bounties`);
    const onTipsPage = (p) => p.startsWith(`/${app.activeChainId()}/tips`)
      || p.startsWith(`/${app.activeChainId()}/proposal/${ProposalType.SubstrateTreasuryTip}`);

    const onCouncilPage = (p) => p.startsWith(`/${app.activeChainId()}/council`);
    const onMotionPage = (p) => (
      p.startsWith(`/${app.activeChainId()}/motions`)
        || p.startsWith(`/${app.activeChainId()}/proposal/${ProposalType.SubstrateCollectiveProposal}`));

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
          onclick: (e) => {
            e.preventDefault();
            navigateToSubpage('/referenda');
          },
          contentRight: [], // TODO
        }),
      // proposals (substrate, cosmos, moloch & compound only)
      !app.community && ((app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Darwinia)
                         || app.chain?.base === ChainBase.CosmosSDK
                         || app.chain?.network === ChainNetwork.Sputnik
                         || app.chain?.network === ChainNetwork.Moloch
                         || app.chain?.network === ChainNetwork.Compound
                         || app.chain?.network === ChainNetwork.Aave)
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onProposalPage(m.route.get()),
          label: 'Proposals',
          class: app.chain?.base === ChainBase.Substrate ? 'sub-button' : '',
          onclick: (e) => {
            e.preventDefault();
            navigateToSubpage('/proposals');
          },
        }),
      // // motions (substrate only)
      // !app.community && (app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Darwinia)
      //   && m(Button, {
      //     fluid: true,
      //     rounded: true,
      //     active: onMotionPage(m.route.get()),
      //     label: 'Motions',
      //     class: 'sub-button',
      //     onclick: (e) => {
      //       e.preventDefault();
      //       navigateToSubpage(`/motions`);
      //     },
      //   }),
      // council (substrate only)
      !app.community && app.chain?.base === ChainBase.Substrate
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onCouncilPage(m.route.get()),
          label: 'Councillors',
          class: 'sub-button',
          onclick: (e) => {
            e.preventDefault();
            navigateToSubpage('/council');
          },
        }),
      m('.sidebar-spacer'),
      // treasury (substrate only)
      !app.community && app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Centrifuge
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onTreasuryPage(m.route.get()),
          label: 'Treasury',
          onclick: (e) => {
            e.preventDefault();
            navigateToSubpage('/treasury');
          },
        }),
      // bounties (substrate only)
      !app.community && app.chain?.base === ChainBase.Substrate
        && app.chain.network !== ChainNetwork.Centrifuge
        && app.chain.network !== ChainNetwork.HydraDX
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onBountiesPage(m.route.get()),
          label: 'Bounties',
          class: 'sub-button',
          onclick: (e) => {
            e.preventDefault();
            navigateToSubpage('/bounties');
          },
        }),
      // tips (substrate only)
      // TODO: which chains?
      !app.community && app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Centrifuge
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onTipsPage(m.route.get()),
          label: 'Tips',
          class: 'sub-button',
          onclick: (e) => {
            e.preventDefault();
            navigateToSubpage('/tips');
          },
        }),
      m('.sidebar-spacer'),
      // validators (substrate only)
      !app.community && app.chain?.base === ChainBase.Substrate
        && app.chain?.network !== ChainNetwork.Kulupu && app.chain?.network !== ChainNetwork.Darwinia
        && m(Button, {
          fluid: true,
          rounded: true,
          active: onValidatorsPage(m.route.get()),
          label: 'Validators',
          onclick: (e) => {
            e.preventDefault();
            navigateToSubpage('/validators');
          },
        }),
      showCompoundOptions && m(Button, {
        fluid: true,
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage('/delegate');
        },
        label: 'Delegate',
        active: m.route.get() === `/${app.activeChainId()}/delegate`,
      }),
      showMolochMemberOptions && m(Button, {
        fluid: true,
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage('/new/proposal/:type', { type: ProposalType.MolochProposal });
        },
        label: 'New proposal',
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
      }),
      showMolochMemberOptions && m(Button, {
        fluid: true,
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          app.modals.lazyCreate('ragequit_modal', { account: app.user.activeAccount });
        },
        label: 'Rage quit',
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
            tokenAddress: ((app.user.activeAccount as any).app.chain as Moloch).governance.api.token.address,
          });
        },
        label: 'Approve tokens',
      }),
      m('.sidebar-spacer'),
      app.chain?.meta.chain.snapshot && m(Button, {
        rounded: true,
        fluid: true,
        active: onSnapshotProposal(m.route.get()),
        label: 'Snapshot Proposals',
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage(`/snapshot/${app.chain.meta.chain.snapshot}`);
        },
      }),
      // app.chain?.meta.chain.snapshot && app.user.activeAccount && m(Button, {
      //   rounded: true,
      //   fluid: true,
      //   active: onSnapshotProposalCreation(m.route.get()),
      //   label: 'New Snapshot Pr...',
      //   onclick: (e) => {
      //     e.preventDefault();
      //     m.route.set(`/${app.activeChainId()}/new/snapshot/${app.chain.meta.chain.snapshot}`);
      //   },
      // }),
      showCommonwealthMenuOptions && m(Button, {
        fluid: true,
        rounded: true,
        label: 'Projects',
        active: m.route.get().startsWith(`/${app.activeChainId()}/projects`),
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage('/projects');
        },
      }),
      // showCommonwealthMenuOptions && m(Button, {
      //   fluid: true,
      //   rounded: true,
      //   label: 'Backers',
      //   active: m.route.get().startsWith(`/${app.activeChainId()}/backers`),
      //   onclick: (e) => {
      //     e.preventDefault();
      //     navigateToSubpage(`/backers`);
      //   },
      // }),
      showCommonwealthMenuOptions && m(Button, {
        fluid: true,
        rounded: true,
        label: 'Collectives',
        active: m.route.get().startsWith(`/${app.activeChainId()}/collectives`),
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage('/collectives');
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
        label: vnode.state.initializing ? 'Connecting...' : 'Connect to chain',
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
      discord && m(Tooltip, {
        transitionDuration: 100,
        content: 'Discord',
        trigger: m(Button, {
          rounded: true,
          onclick: () => window.open(discord),
          label: m(DiscordIcon),
          class: 'discord-button',
        }),
      }),
      element && m(Tooltip, {
        transitionDuration: 100,
        content: 'Element',
        trigger: m(Button, {
          rounded: true,
          onclick: () => window.open(element),
          label: m(ElementIcon),
          class: 'element-button',
        }),
      }),
      telegram && m(Tooltip, {
        transitionDuration: 100,
        content: 'Telegram',
        trigger: m(Button, {
          rounded: true,
          onclick: () => window.open(telegram),
          label: m(TelegramIcon),
          class: 'telegram-button',
        }),
      }),
      github && m(Tooltip, {
        transitionDuration: 100,
        content: 'Github',
        trigger: m(Button, {
          rounded: true,
          onclick: () => window.open(github),
          label: m(GithubIcon),
          class: 'github-button',
        }),
      }),
      website && m(Tooltip, {
        transitionDuration: 100,
        content: 'Homepage',
        trigger: m(Button, {
          rounded: true,
          onclick: () => window.open(website),
          label: m(WebsiteIcon),
          class: 'website-button',
        }),
      }),
    ]);
  }
};

const Sidebar: m.Component<{ hideQuickSwitcher? }, {}> = {
  view: (vnode) => {
    return [
      !app.isCustomDomain() && m(SidebarQuickSwitcher),
      m('.Sidebar', [
        (app.chain || app.community) && m(OffchainNavigationModule),
        (app.chain || app.community) && m(OnchainNavigationModule),
        (app.chain || app.community) && m(ExternalLinksModule),
        m('br'),
        app.isLoggedIn() && (app.chain || app.community) && m(SubscriptionButton),
        app.chain && m(ChainStatusModule),
        app.isCustomDomain()
        && m('a', {
          class: 'PoweredBy',
          onclick: (e) => {
            window.open('https://commonwealth.im/');
          },
        }),
      ]),
    ];
  },
};

export default Sidebar;
