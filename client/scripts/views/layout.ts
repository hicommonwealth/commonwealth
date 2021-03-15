import 'layout.scss';

import m from 'mithril';

import { initChain, initCommunity, initTokenCommunity, deinitChainOrCommunity, selectNode } from 'app';
import app from 'state';

import Sublayout from 'views/sublayout';
import { AppModals } from 'views/modal';
import AppToasts from 'views/toast';
import PageNotFound from 'views/pages/404';

const CHAIN_LOADING_TIMEOUT = 3000;

export const LoadingLayout: m.Component<{ hideSidebar?: boolean }> = {
  view: (vnode) => {
    const { hideSidebar } = vnode.attrs;
    return m('.Layout.mithril-app', {
    }, [
      m(Sublayout, { loadingLayout: true, hideSidebar }),
      m(AppModals),
      m(AppToasts),
    ]);
  }
};

export const Layout: m.Component<{
  scope: string,
  hideSidebar?: boolean,
  deferChain?: boolean,
}, {
  loadingScope,
  deferred
}> = {
  view: (vnode) => {
    const { scope, deferChain, hideSidebar } = vnode.attrs;
    const scopeMatchesChain = app.config.nodes.getAll().find((n) => n.chain.id === scope);
    const scopeMatchesCommunity = app.config.communities.getAll().find((c) => c.id === scope);

    //Is Ethereum Address
    function isEthereumAddress(name : string) {
      return name.startsWith("erc20-0x") && name.length==48
    }

    if (app.loadingError) {
      return m('.Layout.mithril-app', [
        m(Sublayout, { errorLayout: [
          m('p', { style: 'color: #222' }, `Application error: ${app.loadingError}`),
          m('p', { style: 'color: #222' }, 'Please try again at another time'),
        ] }),
        m(AppModals),
        m(AppToasts),
      ]);
    } else if (!app.loginStatusLoaded()) {
      // Wait for /api/status to return with the user's login status
      return m(LoadingLayout, { hideSidebar });
    } else if (scope && isEthereumAddress(scope) && scope !== vnode.state.loadingScope) {
      vnode.state.loadingScope = scope;
      initTokenCommunity(scope.substr("erc20-".length));
      return m(LoadingLayout, { hideSidebar });
    } else if (scope && !scopeMatchesChain && !scopeMatchesCommunity && !isEthereumAddress(scope)) {
      // If /api/status has returned, then app.config.nodes and app.config.communities
      // should both be loaded. If we match neither of them, then we can safely 404
      return m('.Layout.mithril-app', [
        m(PageNotFound),
        m(AppModals),
        m(AppToasts),
      ]);
    } else if (scope && scope !== app.activeId() && scope !== vnode.state.loadingScope) {
      // If we are supposed to load a new chain or community, we do so now
      // This happens only once, and then loadingScope should be set
      vnode.state.loadingScope = scope;
      if (scopeMatchesChain) {
        vnode.state.deferred = deferChain;
        selectNode(scopeMatchesChain, deferChain).then((response) => {
          if (!deferChain && response) {
            initChain();
          }
        });
        return m(LoadingLayout, { hideSidebar });
      } else if (scopeMatchesCommunity) {
        initCommunity(scope);
        return m(LoadingLayout, { hideSidebar });
      }
    } else if (scope && vnode.state.deferred && !deferChain) {
      vnode.state.deferred = false;
      initChain();
      return m(LoadingLayout, { hideSidebar });
    } else if (!scope && ((app.chain && app.chain.class) || app.community)) {
      // Handle the case where we unload the chain or community, if we're
      // going to a page that doesn't have one
      deinitChainOrCommunity().then(() => {
        vnode.state.loadingScope = null;
        m.redraw();
      });
      return m(LoadingLayout, { hideSidebar });
    }

    return m('.Layout.mithril-app', { class: hideSidebar ? 'hide-sidebar' : '' }, [
      vnode.children,
      m(AppModals),
      m(AppToasts),
    ]);
  }
};
