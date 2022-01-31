/* eslint-disable @typescript-eslint/ban-types */
import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import {
  Button, PopoverMenu, MenuItem, Icon, Icons, Tooltip
} from 'construct-ui';
import { selectNode, initChain, navigateToSubpage } from 'app';
import app from 'state';
import { link } from 'helpers';
import { ChainInfo, NodeInfo} from 'models';
import SubscriptionButton from 'views/components/subscription_button';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import { ChainIcon } from 'views/components/chain_icon';
import CommunitySelector from 'views/components/sidebar/community_selector';
import { DiscordIcon, TelegramIcon, ElementIcon, GithubIcon, WebsiteIcon } from '../component_kit/icons';
import { DiscussionSection } from './discussion_section';
import { GovernanceSection } from './governance_section';
import { CWButton } from '../component_kit/cw_button';

// Toggle Tree Definition (3 layers of depth, could add more if desired)
export interface ToggleTree {
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
export function verifyCachedToggleTree(tree_name: string, toggle_tree: ToggleTree) {
  const cached_tree = JSON.parse(localStorage[`${app.activeChainId()}-${tree_name}-toggle-tree`]);
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
          ? ' active' : '',
      }, item instanceof ChainInfo
        ? m(ChainIcon, {
          size,
          chain: item,
          onclick: link ? (() => m.route.set(`/${item.id}`)) : null
        }) : null),
    ]);
  }
};

const SidebarQuickSwitcher: m.Component<{}> = {
  view: (vnode) => {
    const allCommunities = app.config.chains.getAll()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((item) => (item instanceof ChainInfo)
        ? app.config.nodes.getByChain(item.id)?.length > 0
        : true); // only chains with nodes

    const starredCommunities = allCommunities.filter((item) => {
      // filter out non-starred communities
      if (item instanceof ChainInfo && !app.communities.isStarred(item.id, null)) return false;
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
      app.chain.deferred ? m(CWButton, {
        buttonType: 'primary',
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
        trigger: m(Button, {
          // intent: ButtonIntent.Secondary,
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
    if (!app.chain) return;
    const meta = app.chain.meta.chain;
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

const Sidebar: m.Component<{ hideQuickSwitcher?, useQuickSwitcher?: boolean }, {}> = {
  view: (vnode) => {
    const { useQuickSwitcher } = vnode.attrs;
    const isCustom = app.isCustomDomain();

    return [
      !isCustom && m(SidebarQuickSwitcher),
      !useQuickSwitcher && app.chain && m(`.Sidebar${isCustom ? '.custom-domain' : ''}`, [
        m(DiscussionSection),
        m(GovernanceSection),
        m(ExternalLinksModule),
        m('br'),
        app.isLoggedIn() && app.chain && m('.subscription-button', m(SubscriptionButton)),
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