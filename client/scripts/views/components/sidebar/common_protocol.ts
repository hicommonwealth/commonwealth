import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import {
  Button, PopoverMenu, MenuItem
} from 'construct-ui';

import { initChain } from 'app';

import app from 'state';

import ChainStatusIndicator from 'views/components/chain_status_indicator';

export const isCommonProtocolMenu = () => app.community && app.community.meta && app.community.meta.id === 'common-protocol';

export const CWPModule: m.Component<{}> = {
  view: (vnode) => {
    // const projectsRoute = `/${app.activeChainId()}/projects`;
    // const collectivesRoute = `/${app.activeChainId()}/collectives`;
    const projectsRoute = `/${app.activeCommunityId()}/projects`;
    const collectivesRoute = `/${app.activeCommunityId()}/collectives`;
    return m('.OffchainNavigationModule.SidebarModule', [
      m('br'),
      m(Button, {
        fluid: true,
        rounded: true,
        label: 'Projects',
        active: m.route.get().startsWith(projectsRoute),
        onclick: (e) => {
          e.preventDefault();
          m.route.set(projectsRoute);
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
      m(Button, {
        fluid: true,
        rounded: true,
        label: 'Collectives',
        active: m.route.get().startsWith(collectivesRoute),
        onclick: (e) => {
          e.preventDefault();
          m.route.set(collectivesRoute);
        },
      }),
    ]);
  }
};

export const CWPChainStatusModule: m.Component<{}, { initializing: boolean }> = {
  oncreate: async (vnode) => {
    // set app.chain with default Chain of community
    if (!app.chain && app.community && app.community.meta && app.community.meta.defaultChain) {
      const { meta } = app.community;
      if (meta.id === 'common-protocol') {
        const scopeMatchesChain = app.config.nodes.getAll().find((n) => n.chain.id === meta.defaultChain.id);
        const Commonwealth = (await import(
          /* webpackMode: "lazy" */
          /* webpackChunkName: "commonwealth-main" */
          '../../../controllers/chain/ethereum/commonwealth/adapter'
        )).default;
        const communityDefaultChain = new Commonwealth(scopeMatchesChain, app);
        app.chain = communityDefaultChain;
        app.chain.deferred = true;
        m.redraw();
      }
    }
  },
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
            app.chain.deferred = false;
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
                // e.preventDefault();
                // vnode.state.initializing = true;
                // const n: NodeInfo = app.config.nodes.getById(node.value);
                // if (!n) return;
                // const finalizeInitialization = await selectNode(n);
                // if (finalizeInitialization) await initChain();
                // vnode.state.initializing = false;
                // m.redraw();
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

