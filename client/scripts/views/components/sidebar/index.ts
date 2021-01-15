import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import dragula from 'dragula';
import {
  Button, List, ListItem, Popover, PopoverMenu, MenuItem, Icon, Icons, Tag, Spinner, Select
} from 'construct-ui';

import { selectNode, initChain } from 'app';

import app, { ApiStatus } from 'state';
import { ProposalType } from 'identifiers';
import { link } from 'helpers';
import { ChainClass, ChainBase, ChainNetwork, ChainInfo, CommunityInfo, AddressInfo, NodeInfo } from 'models';
import NewTopicModal from 'views/modals/new_topic_modal';

import SubscriptionButton from 'views/components/subscription_button';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import { MobileNewProposalButton } from 'views/components/new_proposal_button';
import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';

import CommunitySelector, { CommunityLabel } from './community_selector';

const SidebarQuickSwitcherItem: m.Component<{ item, size }> = {
  view: (vnode) => {
    const { item, size } = vnode.attrs;

    return m('.SidebarQuickSwitcherItem', {
      key: `${item instanceof ChainInfo ? 'chain' : 'community'}-${item.id}`
    }, [
      m(Popover, {
        interactionType: 'hover',
        hoverOpenDelay: 500,
        hoverCloseDelay: 0,
        transitionDuration: 0,
        position: 'right',
        restoreFocus: false,
        content: m('.quick-switcher-option-text', item.name),
        class: 'SidebarQuickSwitcherItemTooltip',
        trigger: m('.quick-switcher-option', {
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
      }),
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

    const quickSwitcherCommunities = starredCommunities.length > 0 ? starredCommunities : allCommunities.filter((item) => {
      if (item instanceof CommunityInfo && item.collapsedOnHomepage) return false;
      return true;
    });

    const size = 36;
    return m('.SidebarQuickSwitcher', [
      quickSwitcherCommunities.map((item) => m(SidebarQuickSwitcherItem, { item, size })),
    ]);
  }
};

const OffchainNavigationModule: m.Component<{ sidebarTopic: number }, { dragulaInitialized: true }> = {
  view: (vnode) => {
    const { sidebarTopic } = vnode.attrs;

    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`
      || p.startsWith(`/${app.activeId()}/discussions/`)
      || p.startsWith(`/${app.activeId()}/proposal/discussions/`);
    const onSearchPage = (p) => p.startsWith(`/${app.activeId()}/search`);
    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`);
    const onChatPage = (p) => p === `/${app.activeId()}/chat`;

    return m('.OffchainNavigationModule.SidebarModule', [
      m(List, [
        m(ListItem, {
          class: 'section-header',
          label: 'Off-chain Discussions',
          contentRight: app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })
            && m(PopoverMenu, {
              class: 'sidebar-add-topic',
              position: 'bottom',
              transitionDuration: 0,
              hoverCloseDelay: 0,
              closeOnContentClick: true,
              trigger: m(Icon, { name: Icons.CHEVRON_DOWN }),
              content: m(MenuItem, {
                label: 'New topic',
                onclick: (e) => {
                  e.preventDefault();
                  app.modals.create({ modal: NewTopicModal });
                }
              }),
            }),
        }),
        m(ListItem, {
          active: onDiscussionsPage(m.route.get())
            && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
          label: 'Discussions',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeId()}`);
          },
          contentLeft: m(Icon, { name: Icons.MESSAGE_CIRCLE }),
        }),
        m(ListItem, {
          active: onSearchPage(m.route.get())
            && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
          label: 'Search',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeId()}/search`);
          },
          contentLeft: m(Icon, { name: Icons.SEARCH }),
        }),
        m(ListItem, {
          active: onMembersPage(m.route.get())
            && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
          label: 'Members',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeId()}/members`);
          },
          contentLeft: m(Icon, { name: Icons.USERS }),
        }),
        // m(ListItem, {
        //   active: onChatPage(m.route.get()),
        //   label: 'Chat',
        //   onclick: (e) => {
        //     e.preventDefault();
        //     m.route.set(`/${app.activeId()}/chat`);
        //   },
        //   contentLeft: m(Icon, { name: Icons.MESSAGE_CIRCLE }),
        // }),
      ]),
    ]);
  }
};

const OnchainNavigationModule: m.Component<{}, {}> = {
  view: (vnode) => {
    // // proposal counts
    // const substrateGovernanceProposals = (app.chain?.loaded && app.chain?.base === ChainBase.Substrate)
    //   ? ((app.chain as any).democracy.store.getAll().filter((p) => !p.completed && !p.passed).length
    //     + (app.chain as any).democracyProposals.store.getAll().filter((p) => !p.completed).length
    //     + (app.chain as any).council.store.getAll().filter((p) => !p.completed).length
    //     + (app.chain as any).treasury.store.getAll().filter((p) => !p.completed).length) : 0;
    // const edgewareSignalingProposals = (app.chain?.loaded && app.chain?.class === ChainClass.Edgeware)
    //   ? (app.chain as any).signaling.store.getAll().filter((p) => !p.completed).length : 0;
    // const allSubstrateGovernanceProposals = substrateGovernanceProposals + edgewareSignalingProposals;
    // const cosmosGovernanceProposals = (app.chain?.loaded && app.chain?.base === ChainBase.CosmosSDK)
    //   ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;
    // const molochProposals = (app.chain?.loaded && app.chain?.class === ChainClass.Moloch)
    //   ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;

    const hasProposals = app.chain && !app.community && (
      app.chain.base === ChainBase.CosmosSDK
        || (app.chain.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Plasm)
        || app.chain.class === ChainClass.Moloch
        || app.chain.network === ChainNetwork.Marlin
        || app.chain.network === ChainNetwork.MarlinTestnet);
    if (!hasProposals) return;

    const showMolochMenuOptions = app.user.activeAccount && app.chain?.class === ChainClass.Moloch;
    const showMolochMemberOptions = showMolochMenuOptions && (app.user.activeAccount as any)?.shares?.gtn(0);

    const showMarlinOptions = app.user.activeAccount && app.chain?.network === ChainNetwork.Marlin;

    const onProposalPage = (p) => (
      p.startsWith(`/${app.activeChainId()}/proposals`)
        || p.startsWith(`/${app.activeChainId()}/signaling`)
        || p.startsWith(`/${app.activeChainId()}/proposal/councilmotion`)
        || p.startsWith(`/${app.activeChainId()}/proposal/democracyproposal`)
        || p.startsWith(`/${app.activeChainId()}/proposal/signalingproposal`));
    const onReferendaPage = (p) => p.startsWith(`/${app.activeChainId()}/referenda`)
      || p.startsWith(`/${app.activeChainId()}/proposal/referendum`);
    const onTreasuryPage = (p) => p.startsWith(`/${app.activeChainId()}/treasury`)
      || p.startsWith(`/${app.activeChainId()}/proposal/treasuryproposal`);
    const onCouncilPage = (p) => p.startsWith(`/${app.activeChainId()}/council`);

    const onValidatorsPage = (p) => p.startsWith(`/${app.activeChainId()}/validators`);
    const onNotificationsPage = (p) => p.startsWith('/notifications');
    if (onNotificationsPage(m.route.get())) return;

    return m('.OnchainNavigationModule.SidebarModule', [
      m(List, [
        m(ListItem, {
          label: 'On-chain Governance',
          class: 'section-header',
        }),
        // referenda (substrate only)
        !app.community && app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Darwinia
          && m(ListItem, {
            active: onReferendaPage(m.route.get()),
            label: 'Referenda',
            contentLeft: m(Icon, { name: Icons.CHECK_SQUARE }),
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${app.activeChainId()}/referenda`);
            },
            contentRight: [], // TODO
          }),
        // proposals (substrate, cosmos, moloch only)
        m(ListItem, {
          active: onProposalPage(m.route.get()) && app.chain.network !== ChainNetwork.Darwinia,
          label: app.chain?.base === ChainBase.Substrate ? 'Proposals & Motions' : 'Proposals',
          contentLeft: m(Icon, { name: Icons.SEND }),
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeChainId()}/proposals`);
          },
        }),
        // treasury (substrate only)
        !app.community && app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Centrifuge
          && m(ListItem, {
            active: onTreasuryPage(m.route.get()),
            label: 'Treasury',
            contentLeft: m(Icon, { name: Icons.TRUCK }),
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${app.activeChainId()}/treasury`);
            },
          }),
        // council (substrate only)
        !app.community && app.chain?.base === ChainBase.Substrate
          && m(ListItem, {
            active: onCouncilPage(m.route.get()),
            label: 'Council',
            contentLeft: m(Icon, { name: Icons.AWARD }),
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${app.activeChainId()}/council`);
            },
          }),
        // validators (substrate and cosmos only)
        // !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate) &&
        //   m(ListItem, {
        //     contentLeft: m(Icon, { name: Icons.SHARE_2 }),
        //     active: onValidatorsPage(m.route.get()),
        //     label: 'Validators',
        //     onclick: (e) => {
        //       e.preventDefault();
        //       m.route.set(`/${app.activeChainId()}/validators`),
        //     },
        //   }),
        showMolochMemberOptions && m(ListItem, {
          active: m.route.get() === `/${app.activeChainId()}/new/proposal/:type`,
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.MolochProposal });
          },
          label: 'New proposal',
          contentLeft: m(Icon, { name: Icons.FILE_PLUS }),
        }),
        showMolochMemberOptions && m(ListItem, {
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
        showMolochMemberOptions && m(ListItem, {
          onclick: (e) => {
            e.preventDefault();
            app.modals.lazyCreate('ragequit_modal', { account: app.user.activeAccount });
          },
          label: 'Rage quit',
          contentLeft: m(Icon, { name: Icons.FILE_MINUS }),
        }),
        showMolochMenuOptions && m(ListItem, {
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
        showMarlinOptions && m(ListItem, {
          active: m.route.get() === `/${app.activeChainId()}/new/proposal/${ProposalType.MarlinProposal}`,
          onclick: (e) => m.route.set(`/${app.activeChainId()}/new/proposal/:type`, {
            type: ProposalType.MarlinProposal
          }),
          label: 'Propose',
          contentLeft: m(Icon, { name: Icons.FILE_PLUS }),
        }),
        showMarlinOptions && m(ListItem, {
          active: m.route.get() === `/${app.activeChainId()}/delegate`,
          onclick: (e) => m.route.set(`/${app.activeChainId()}/delegate`),
          label: 'Delegate',
          contentLeft: m(Icon, { name: Icons.FLAG }),
        }),
      ]),
    ]);
  }
};

const ChainStatusModule: m.Component<{}, { initializing: boolean }> = {
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
      m(PopoverMenu, {
        transitionDuration: 0,
        closeOnContentClick: true,
        closeOnOutsideClick: true,
        content: app.chain.deferred ? m(MenuItem, {
          label: 'Connect to chain',
          onclick: async (e) => {
            e.preventDefault();
            vnode.state.initializing = true;
            await initChain();
            vnode.state.initializing = false;
            m.redraw();
          }
        }) : nodes.filter((node) => node.chainId === app.activeChainId()).map((node) => {
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
          class: 'chain-status-main',
          fluid: true,
          disabled: vnode.state.initializing,
          label: vnode.state.initializing ? 'Connecting...' : app.chain.deferred
            ? 'Ready to connect' : m(ChainStatusIndicator),
        }),
      }),
    ]);
  }
};

const Sidebar: m.Component<{ sidebarTopic: number }, { open: boolean }> = {
  view: (vnode) => {
    const { sidebarTopic } = vnode.attrs;

    return [
      m('.MobileSidebarHeader', {
        onclick: (e) => {
          e.preventDefault();
          // clicking anywhere outside the trigger should close the sidebar
          const onTrigger = $(e.target).hasClass('mobile-sidebar-trigger')
            || $(e.target).closest('.mobile-sidebar-trigger').length > 0;
          if (!onTrigger && vnode.state.open) vnode.state.open = false;
        },
      }, [
        m('.mobile-sidebar-left', [
          m(Button, {
            class: 'mobile-sidebar-trigger',
            compact: true,
            onclick: (e) => {
              e.preventDefault();
              vnode.state.open = !vnode.state.open;
            },
            label: m(Icon, { name: Icons.MENU }),
          }),
          app.isLoggedIn() && m(MobileNewProposalButton),
        ]),
        m('.mobile-sidebar-center', {
          class: `${app.isLoggedIn() ? 'logged-in' : ''} ${((app.chain || app.community) && !app.chainPreloading) ? '' : 'no-community'}`,
        }, [
          m('.community-label', m(CommunitySelector)),
        ]),
        m('.mobile-sidebar-right', [
          app.isLoggedIn() && m(NotificationsMenu, { small: false }),
          m(LoginSelector, { small: false }),
        ]),
      ]),
      m(SidebarQuickSwitcher),
      m('.Sidebar', {
        class: vnode.state.open ? 'open' : '',
        onclick: (e) => {
          e.preventDefault();
          // clicking inside the sidebar should close the sidebar
          vnode.state.open = false;
        },
      }, [
        (app.chain || app.community) && m('.SidebarHeader', m(CommunitySelector)),
        m('.sidebar-content', [ // container for overflow scrolling
          (app.chain || app.community) && m(OffchainNavigationModule, { sidebarTopic }),
          (app.chain || app.community) && m(OnchainNavigationModule),
        ]),
        (app.chain || app.community) && m(SubscriptionButton),
        app.chain && m(ChainStatusModule),
        m('.sidebar-fadeout'),
      ])
    ];
  },
};

export default Sidebar;
