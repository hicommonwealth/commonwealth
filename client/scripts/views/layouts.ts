import 'layout.scss';

import m from 'mithril';
import $ from 'jquery';

import { initChain, initCommunity, deinitChainOrCommunity } from 'app';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import Navigation from 'views/components/navigation';
import Sidebar from 'views/components/sidebar';
import PageNotFound from 'views/pages/404';
import { AppModals } from 'views/modal';
import { AppToasts } from 'views/toast';
import { featherIcon } from 'helpers';

const CHAIN_LOADING_TIMEOUT = 3000;

export const LoadingLayout: m.Component<{ activeTag: string }> = {
  view: (vnode) => {
    const { activeTag } = vnode.attrs;

    return m('.mithril-app', [
      m(Sidebar),
      m(Navigation, { activeTag }),
      m('.layout-content', {
        class: app.isLoggedIn() ? 'logged-in' : 'logged-out'
      }, [
        m('.LoadingLayout'),
      ]),
      m(AppModals),
      m(AppToasts),
    ]);
  }
};

export const Layout: m.Component<{ scope: string, activeTag?: string }, { loadingScope }> = {
  view: (vnode) => {
    const { scope, activeTag } = vnode.attrs;
    const scopeMatchesChain = app.config.nodes.getAll().find((n) => n.chain.id === scope);
    const scopeMatchesCommunity = app.config.communities.getAll().find((c) => c.id === scope);

    if (!app.loginStatusLoaded()) {
      // Wait for /api/status to return with the user's login status
      return m(LoadingLayout, { activeTag });
    } else if (scope && !scopeMatchesChain && !scopeMatchesCommunity) {
      // If /api/status has returned, then app.config.nodes and app.config.communities
      // should both be loaded. If we match neither of them, then we can safely 404
      return m('.mithril-app', [
        m(Sidebar),
        m(Navigation, { activeTag }),
        m('.layout-content', {
          class: app.isLoggedIn() ? 'logged-in' : 'logged-out'
        }, m(PageNotFound)),
        m(AppModals),
        m(AppToasts),
      ]);
    } else if (scope &&
               scope !== app.activeId() &&
               scope !== vnode.state.loadingScope) {
      // If we are supposed to load a new chain or community, we do so now
      // This happens only once, and then loadingScope should be set
      vnode.state.loadingScope = scope;
      if (scopeMatchesChain) {
        initChain(scope);
        return m(LoadingLayout, { activeTag });
      } else if (scopeMatchesCommunity) {
        initCommunity(scope);
        return m(LoadingLayout, { activeTag });
      }
    } else if (!scope && ((app.chain && app.chain.class) || app.community)) {
      // Handle the case where we unload the chain or community, if we're
      // going to a page that doesn't have one
      deinitChainOrCommunity().then(() => {
        vnode.state.loadingScope = null;
        m.redraw();
      });
      return m(LoadingLayout, { activeTag });
    }

    return m('.mithril-app', [
      m(Sidebar),
      m(Navigation, { activeTag }),
      m('.layout-content', {
        class: app.isLoggedIn() ? 'logged-in' : 'logged-out'
      }, vnode.children),
      m(AppModals),
      m(AppToasts),
    ]);
  }
};
