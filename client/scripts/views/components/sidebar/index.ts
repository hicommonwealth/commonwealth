import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import {
  Button, PopoverMenu, MenuItem, Icon, Icons, Tooltip
} from 'construct-ui';
import produce from 'immer';
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
import { DiscordIcon, TelegramIcon, ElementIcon, GithubIcon, WebsiteIcon } from '../component_kit/icons';
import SidebarSection, { SectionGroupProps, SidebarSectionProps, SubSectionProps } from './sidebar_section';
import { ButtonIntent, FaceliftButton } from '../component_kit/buttons';

// Toggle Tree Definition (3 layers of depth, could add more if desired)
interface ToggleTree {
  toggled_state: boolean;
  children: {
    [child: string]: {
      toggled_state: boolean;
      children: {
        [child: string]: {
          toggled_state: boolean;
        }
      }
    },
  }
}

function comparisonCustomizer(value1, value2) {
  if (typeof value1 === "boolean" && typeof value2 === "boolean") {
    return true;
  }
}
// Check that our current cached tree is structurally correct
function verifyCachedToggleTree(tree_name: string, toggle_tree: ToggleTree) {
  const cached_tree = JSON.parse(localStorage[`${app.activeId()}-${tree_name}-toggle-tree`]);
  return _.isEqualWith(cached_tree, toggle_tree, comparisonCustomizer);
}

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
            e.preventDefault();
            m.route.set('/createCommunity');
          },
        }),
      ]),
      m('.scrollable-community-bar', [
        starredCommunities.map((item) => m(SidebarQuickSwitcherItem, { item, size })),
      ]),
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
      app.chain.deferred ? m(FaceliftButton, {
        intent: ButtonIntent.Primary,
        label: vnode.state.initializing ? 'Connecting...' : 'Connect to chain',
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
        trigger: m(FaceliftButton, {
          intent: ButtonIntent.Secondary,
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

const DiscussionSection: m.Component<{}, {}> = {
  view: (vnode) => {
    // Conditional Render Details + 
    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`
      || p.startsWith(`/${app.activeId()}/discussions/`)
      || p.startsWith(`/${app.activeId()}/proposal/discussion/`)
      || p.startsWith(`/${app.activeId()}?`);
    const onAllDiscussionPage = (p) => p === `/${app.activeId()}/` || p === `/${app.activeId()}`;
    const onFeaturedDiscussionPage = (p, topic) => decodeURI(p).endsWith(`/discussions/${topic}`);
    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`)
      || p.startsWith(`/${app.activeId()}/account/`);
    const onSputnikDaosPage = (p) => p.startsWith(`/${app.activeId()}/sputnik-daos`);

    const topics = app.topics.getByCommunity(app.activeId()).map(({ id, name, featuredInSidebar }) => {
      return { id, name, featuredInSidebar };
    }).filter((t) => t.featuredInSidebar).sort((a, b) => a.name.localeCompare(b.name));

    const load_discussion_sections = onDiscussionsPage(m.route.get())
                            && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true);

    const discussionsLabel = (['vesuvius', 'olympus'].includes(app.activeId())) ? 'FORUMS' : 'DISCUSSIONS';

    // Build Toggle Tree 
    let discussions_default_toggle_tree = {
      toggled_state: true,
      children: {}
    }

    for (const topic of topics) {
      if (topic.featuredInSidebar) {
        discussions_default_toggle_tree.children[topic.name] = {
          toggled_state: true,
          children: {
            'All': {
              toggled_state: false,
              children: {}
            }, 
            ...(app.activeId() === 'near') && {
              'SputnikDaos': {
                toggled_state: false,
                children: {}
              }
            }
          }
        }
      }
    }

    // Check if an existing toggle tree is stored
    if (!localStorage[`${app.activeId()}-discussions-toggle-tree`]) {
      console.log("setting discussions toggle tree since it doesn't exist")
      localStorage[`${app.activeId()}-discussions-toggle-tree`] = JSON.stringify(discussions_default_toggle_tree);
    } else if (!verifyCachedToggleTree('discussions', discussions_default_toggle_tree)) {
      console.log("setting discussions toggle tree since the cached version differs from the updated version")
      localStorage[`${app.activeId()}-discussions-toggle-tree`] = JSON.stringify(discussions_default_toggle_tree);
    }
    const toggle_tree_state = JSON.parse(localStorage[`${app.activeId()}-discussions-toggle-tree`])   

    const discussions_group_data: SectionGroupProps[] = [{
      title: 'All',
      contains_children: false,
      default_toggle: false,
      is_visible: true,
      is_updated: true,
      is_active: onAllDiscussionPage(m.route.get()),
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setDiscussionsToggleTree(`children.All.toggled_state`, toggle);
        navigateToSubpage("/");
      },
      display_data: null
    },
    (app.activeId() === 'near') && {
      title: 'Sputnik Daos',
      contains_children: false,
      default_toggle: false,
      is_visible: true,
      is_updated: true,
      is_active: onSputnikDaosPage(m.route.get())
      && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setDiscussionsToggleTree(`children.SputnikDAOs.toggled_state`, toggle);
        navigateToSubpage('/sputnik-daos');
      },
      display_data: null
    }];

    for (const topic of topics) {
      if (topic.featuredInSidebar) {
        const discussion_section_group: SectionGroupProps = {
          title: topic.name,
          contains_children: false,
          default_toggle: false,
          is_visible: true,
          is_updated: true,
          is_active: onFeaturedDiscussionPage(m.route.get(), topic.name),
          onclick: (e, toggle: boolean) => {
            e.preventDefault();
            setDiscussionsToggleTree(`children.${topic.name}.toggled_state`, toggle);
            navigateToSubpage(`/discussions/${topic.name}`);
          },
          display_data: null
        }
        discussions_group_data.push(discussion_section_group)
      }
    }

    const sidebar_section_data: SidebarSectionProps = {
      title: discussionsLabel,
      default_toggle: toggle_tree_state['toggled_state'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setDiscussionsToggleTree('toggled_state', toggle);
      },
      display_data: discussions_group_data,
      is_active: true
    }

    return m(SidebarSection, {...sidebar_section_data});
  }
}

const GovernanceSection: m.Component<{}, {}> = {
  view: (vnode) => {
    // Conditional Render Details
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
    const showSnapshotOptions = app.chain?.meta.chain.snapshot.length > 0;
    const showReferenda = !app.community && app.chain?.base === ChainBase.Substrate
                            && app.chain.network !== ChainNetwork.Darwinia
                            && app.chain.network !== ChainNetwork.HydraDX;
    const showProposals = !app.community && ((app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Darwinia)
                            || app.chain?.base === ChainBase.CosmosSDK
                            || app.chain?.network === ChainNetwork.Sputnik
                            || app.chain?.network === ChainNetwork.Moloch
                            || app.chain?.network === ChainNetwork.Compound
                            || app.chain?.network === ChainNetwork.Aave)      
    const showCouncillors = !app.community && app.chain?.base === ChainBase.Substrate;
    const showTreasury = !app.community && app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Centrifuge;
    const showBounties = !app.community && app.chain?.base === ChainBase.Substrate
                            && app.chain.network !== ChainNetwork.Centrifuge
                            && app.chain.network !== ChainNetwork.HydraDX;
    const showTips =  !app.community && app.chain?.base === ChainBase.Substrate && app.chain.network !== ChainNetwork.Centrifuge;
    const showValidators =  !app.community && app.chain?.base === ChainBase.Substrate
                              && app.chain?.network !== ChainNetwork.Kulupu && app.chain?.network !== ChainNetwork.Darwinia;
    

    // ---------- Build Toggle Tree ---------- //
    let governance_default_toggle_tree: ToggleTree = {
      toggled_state: true,
      children: {
        'Members': {
          toggled_state: false,
          children: {}
        },
        ...(showSnapshotOptions) && {
          'Snapshots': {
            toggled_state: false,
            children: {}
          }
        },
        ...(showReferenda || showProposals || showCouncillors) && {
          'Referenda': {
            toggled_state: true,
            children: {
              ...(showReferenda) && {
                'Referenda': {
                  toggled_state: true
                }
              },
              ...(showProposals) && {
                'Proposals': {
                  toggled_state: true
                }
              },
              ...(showCouncillors) && {
                'Councillors': {
                  toggled_state: true
                }
              }
            }
          }
        },
        ...(showValidators) && {
          'Validators': {
            toggled_state: false,
            children: {}
          }
        },
        ...(showCompoundOptions) && {
          'Delegate': {
            toggled_state: false,
            children: {}
          }
        },
        ...(showTreasury || showBounties || showTips) && {
          'Treasury': {
            toggled_state: true,
            children: {
              ...(showTreasury) && {
                'Treasury': {
                  toggled_state: true
                }
              },
              ...(showBounties) && {
                'Bounties': {
                  toggled_state: true
                }
              },
              ...(showTips) && {
                'Tips': {
                  toggled_state: true
                }
              }
            }
          }
        },
        ...(showMolochMemberOptions) && {
          'Moloch': {
            toggled_state: true,
            children: {
              'New-Proposal': {
                toggled_state: true
              },
              'Update-Delegate-Key': {
                toggled_state: true
              },
              'Rage-Quit': {
                toggled_state: true
              }
            }
          }
        },
        ...(showCommonwealthMenuOptions) && {
          'Commonwealth': {
            toggled_state: true,
            children: {
              'Projects': {
                toggled_state: true
              },
              'Collectives': {
                toggled_state: true
              },
            }
          }
        },
      }
    }

    // Check if an existing toggle tree is stored
    if (!localStorage[`${app.activeId()}-governance-toggle-tree`]) {
      console.log("setting toggle tree from scratch")
      localStorage[`${app.activeId()}-governance-toggle-tree`] = JSON.stringify(governance_default_toggle_tree);
    } else if (!verifyCachedToggleTree('governance', governance_default_toggle_tree)) {
      console.log("setting discussions toggle tree since the cached version differs from the updated version")
      localStorage[`${app.activeId()}-governance-toggle-tree`] = JSON.stringify(governance_default_toggle_tree);
    }
    const toggle_tree_state = JSON.parse(localStorage[`${app.activeId()}-governance-toggle-tree`])    

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
    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`)
    || p.startsWith(`/${app.activeId()}/account/`);

    if (onNotificationsPage(m.route.get())) return;

    // ---------- Build Section Props ---------- //

    // Members
    const members_data: SectionGroupProps = {
      title: 'Members',
      contains_children: false,
      default_toggle: toggle_tree_state['children']['Members']['toggled_state'],
      is_visible: true,
      is_updated: true,
      is_active: onMembersPage(m.route.get())
      && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Members.toggled_state', toggle)
        navigateToSubpage('/members')
      },
      display_data: null
    }

    // Snapshots
    const snapshot_data: SectionGroupProps = {
      title: 'Snapshots',
      contains_children: false,
      default_toggle: showSnapshotOptions ? toggle_tree_state['children']['Snapshots']['toggled_state'] : false,
      is_visible: showSnapshotOptions,
      is_active: onSnapshotProposal(m.route.get()),
      is_updated: true,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Snapshots.toggled_state', toggle)
        // Check if we have multiple snapshots for conditional redirect
        const snapshotSpaces = app.chain.meta.chain.snapshot;
        if (snapshotSpaces.length > 1) {
          navigateToSubpage('/multiple-snapshots', {action: 'select-space'});
        } else {
          navigateToSubpage(`/snapshot/${snapshotSpaces}`);
        }
      },
      display_data: null
    }

    // Referenda
    const referenda_section_data: SubSectionProps[] = [
      {
        title: 'Referenda',
        onclick: (e, toggle: boolean) => {
          e.preventDefault(); 
          navigateToSubpage('/referenda');
          setGovernanceToggleTree('children.Referenda.children.Referenda.toggled_state', toggle)
        },
        is_visible: showReferenda,
        is_updated: true,
        is_active: onReferendaPage(m.route.get()),
        row_icon: false
      },
      {
        title: 'Proposals',
        onclick: (e, toggle: boolean) => {
          e.preventDefault(); 
          navigateToSubpage('/proposals');
          setGovernanceToggleTree('children.Referenda.children.Proposals.toggled_state', toggle)
        },
        is_visible: showProposals,
        is_updated: true,
        is_active: onProposalPage(m.route.get()),
        row_icon: false
      },
      {
        title: 'Councillors',
        onclick: (e, toggle: boolean) => {
          e.preventDefault(); 
          navigateToSubpage('/council');
          setGovernanceToggleTree('children.Referenda.children.Referenda.toggled_state', toggle)
        },
        is_visible: showCouncillors,
        is_updated: true,
        is_active: onCouncilPage(m.route.get()),
        row_icon: false
      }
    ]

    const referenda_data: SectionGroupProps = {
      title: 'Referenda',
      contains_children: true,
      default_toggle: (showReferenda || showProposals || showCouncillors) ? toggle_tree_state['children']['Referenda']['toggled_state'] : false,
      is_visible: showReferenda || showProposals || showCouncillors,
      is_active: showReferenda || showProposals || showCouncillors,
      is_updated: true,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Referenda.toggled_state', toggle)
      },
      display_data: referenda_section_data
    }

    // Delegate
    const delegate_data: SectionGroupProps = {
      title: 'Delegate',
      contains_children: false,
      default_toggle: showCompoundOptions ? toggle_tree_state['children']['Delegate']['toggled_state'] : false,
      is_visible: showCompoundOptions,
      is_updated: true,
      is_active: m.route.get() === `/${app.activeChainId()}/delegate`,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Delegate.toggled_state', toggle)
        navigateToSubpage('/delegate')
      },
      display_data: null
    }

    // Treasury
    const treasury_section_data: SubSectionProps[] = [
      {
        title: 'Treasury',
        onclick: (e) => {
          e.preventDefault(); 
          navigateToSubpage('/treasury');
        },
        is_visible: showTreasury,
        is_updated: true,
        is_active: onTreasuryPage(m.route.get()),
        row_icon: false
      },
      {
        title: 'Bounties',
        onclick: (e) => {
          e.preventDefault(); 
          navigateToSubpage('/bounties');
        },
        is_visible: showBounties,
        is_updated: true,
        is_active: onBountiesPage(m.route.get()),
        row_icon: false
      },
      {
        title: 'Tips',
        onclick: (e) => {
          e.preventDefault(); 
          navigateToSubpage('/tips');
        },
        is_visible: showTips,
        is_updated: true,
        is_active: onTipsPage(m.route.get()),
        row_icon: false
      }
    ]

    const treasury_data: SectionGroupProps = {
      title: 'Treasury',
      contains_children: true,
      default_toggle: (showTreasury || showBounties || showTips) ? toggle_tree_state['children']['Treasury']['toggled_state'] : false, 
      is_visible: showTreasury || showBounties || showTips,
      is_active: showTreasury || showBounties || showTips,
      is_updated: true,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Treasury.toggled_state', toggle)
      },
      display_data: treasury_section_data
    }

    // Validators
    const validators_data: SectionGroupProps = {
      title: 'Validators',
      contains_children: false,
      default_toggle: showValidators ? toggle_tree_state['children']['Validators']['toggled_state'] : false,
      is_visible: showValidators,
      is_updated: true,
      is_active: onValidatorsPage(m.route.get()),
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Validators.toggled_state', toggle)
        navigateToSubpage('/validators')
      },
      display_data: null
    }

    // Moloch
    const moloch_section_data: SubSectionProps[] = [
      {
        title: 'New Proposal',
        onclick: (e) => {
          e.preventDefault(); 
          navigateToSubpage('/new/proposal/:type', { type: ProposalType.MolochProposal });
        },
        is_visible: showMolochMemberOptions,
        is_updated: true,
        is_active: m.route.get() === `/${app.activeChainId()}/new/proposal`, // TODO: Verify this works (and the other two)
        row_icon: false
      },
      {
        title: 'Update Delegate Key',
        onclick: (e) => {
          e.preventDefault(); 
          app.modals.lazyCreate('update_delegate_modal', {
            account: app.user.activeAccount,
            delegateKey: (app.user.activeAccount as any).delegateKey,
          });
        },
        is_visible: showMolochMemberOptions,
        is_updated: true,
        is_active: false,
        row_icon: false
      },
      {
        title: 'Rage Quit',
        onclick: (e) => {
          e.preventDefault(); 
          app.modals.lazyCreate('ragequit_modal', { account: app.user.activeAccount });
        },
        is_visible: showMolochMemberOptions,
        is_updated: true,
        is_active: false,
        row_icon: false
      }
    ]

    const moloch_data: SectionGroupProps = {
      title: 'Moloch',
      contains_children: true,
      default_toggle: showMolochMemberOptions ? toggle_tree_state['children']['Moloch']['toggled_state'] : false,
      is_visible: showMolochMemberOptions,
      is_active: showMolochMemberOptions,
      is_updated: true,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Moloch.toggled_state', toggle)
      },
      display_data: moloch_section_data
    }

    // Commonwealth
    const commonwealth_section_data: SubSectionProps[] = [
      {
        title: 'Projects',
        onclick: (e) => {
          e.preventDefault(); 
          navigateToSubpage('/projects');
        },
        is_updated: true,
        is_visible: showCommonwealthMenuOptions,
        is_active: m.route.get().startsWith(`/${app.activeChainId()}/projects`),
        row_icon: false
      },
      {
        title: 'Collectives',
        onclick: (e) => {
          e.preventDefault(); 
          navigateToSubpage('/collectives');
        },
        is_updated: true,
        is_visible: showCommonwealthMenuOptions,
        is_active: m.route.get().startsWith(`/${app.activeChainId()}/collectives`),
        row_icon: false
      },
    ]

    const commonwealth_data: SectionGroupProps = {
      title: 'Commonwealth',
      contains_children: true,
      default_toggle: showCommonwealthMenuOptions ? toggle_tree_state['children']['Commonwealth']['toggled_state'] : false,
      is_visible: showCommonwealthMenuOptions,
      is_updated: true,
      is_active: showCommonwealthMenuOptions,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Commonwealth.toggled_state', toggle)
      },
      display_data: commonwealth_section_data
    }
  
    const governance_group_data: SectionGroupProps[] = [members_data, snapshot_data, referenda_data, delegate_data, treasury_data,
                                                          validators_data, moloch_data, commonwealth_data]

    const sidebar_section_data: SidebarSectionProps = {
      title: 'GOVERNANCE',
      default_toggle: toggle_tree_state['toggled_state'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('toggled_state', toggle);
      },
      display_data: governance_group_data,
      is_active: false
    }

    return m(SidebarSection, {...sidebar_section_data});
  }
}

function setDiscussionsToggleTree(path: string, toggle: boolean) {
  let current_tree = JSON.parse(localStorage[`${app.activeId()}-discussions-toggle-tree`]);
  const new_tree = produce(current_tree, (draft) => {
    let cur_obj = draft;
    const split = path.split('.');
    for (const field of split.slice(0, split.length-1)) {
      if (cur_obj.hasOwnProperty(field)) {
        cur_obj = cur_obj[field];
      } else {
        return;
      }
    }
    cur_obj[split[split.length-1]] = toggle;
  })

  localStorage[`${app.activeId()}-discussions-toggle-tree`] = JSON.stringify(new_tree);
}

function setGovernanceToggleTree(path: string, toggle: boolean) {
  let current_tree = JSON.parse(localStorage[`${app.activeId()}-governance-toggle-tree`]);
  const new_tree = produce(current_tree, (draft) => {
    let cur_obj = draft;
    const split = path.split('.');
    for (const field of split.slice(0, split.length-1)) {
      if (cur_obj.hasOwnProperty(field)) {
        cur_obj = cur_obj[field];
      } else {
        return;
      }
    }
    cur_obj[split[split.length-1]] = toggle;
  })

  localStorage[`${app.activeId()}-governance-toggle-tree`] = JSON.stringify(new_tree);
}

const Sidebar: m.Component<{ hideQuickSwitcher?, useQuickSwitcher?: boolean }, {}> = {
  view: (vnode) => {
    const { useQuickSwitcher } = vnode.attrs;

    return [
      !app.isCustomDomain() && m(SidebarQuickSwitcher),
      !useQuickSwitcher && (app.chain || app.community) && m('.Sidebar', [
        m(DiscussionSection),
        m(GovernanceSection),
        m(ExternalLinksModule),
        m('br'),
        app.isLoggedIn() && (app.chain || app.community) && m('.subscription-button', m(SubscriptionButton)),
        app.chain && m(ChainStatusModule),
        app.isCustomDomain()
        && m('a', {
          class: 'PoweredBy',
          onclick: (e) => {
            window.open('https://commonwealth.im/');
          },
        }),
        m('.spacer', '')
      ]),
    ];
  },
};

export default Sidebar;

// OLD (MODIFY SOON)
export const OffchainNavigationModule: m.Component<{}, { dragulaInitialized: true }> = {
  view: (vnode) => {
    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`
      || p.startsWith(`/${app.activeId()}/discussions/`)
      || p.startsWith(`/${app.activeId()}/proposal/discussion/`)
      || p.startsWith(`/${app.activeId()}?`);
    const onFeaturedDiscussionPage = (p, topic) => decodeURI(p).endsWith(`/discussions/${topic}`);
    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`)
      || p.startsWith(`/${app.activeId()}/account/`);
    const onSputnikDaosPage = (p) => p.startsWith(`/${app.activeId()}/sputnik-daos`);

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
            navigateToSubpage(`/discussions/${encodeURI(t.name)}`);
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
      (app.activeId() === 'near'
      ? m(Button, {
        rounded: true,
        fluid: true,
        active: onSputnikDaosPage(m.route.get())
          && (app.chain ? app.chain.serverLoaded : app.community ? app.community.serverLoaded : true),
        label: 'Sputnik DAOs',
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage('/sputnik-daos');
        },
      })
      : '')
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
          navigateToSubpage('/new/proposal');
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
      m('.sidebar-spacer'),
      app.chain?.meta.chain.snapshot.length > 0 && m(Button, {
        rounded: true,
        fluid: true,
        active: onSnapshotProposal(m.route.get()),
        label: 'Snapshots',
        onclick: (e) => {
          e.preventDefault();
          // Check if we have multiple snapshots for conditional redirect
          const snapshotSpaces = app.chain.meta.chain.snapshot;
          if (snapshotSpaces.length > 1) {
            navigateToSubpage('/multiple-snapshots', {action: 'select-space'});
          } else {
            navigateToSubpage(`/snapshot/${snapshotSpaces}`);
          }
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