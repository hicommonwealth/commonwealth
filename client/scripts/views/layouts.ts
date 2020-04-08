import 'layout.scss';

import m from 'mithril';
import $ from 'jquery';

import { initChain, initCommunity, deinitChainOrCommunity } from 'app';
import app from 'state';
import { selectLogin } from 'controllers/app/login';
import { notifyError } from 'controllers/app/notifications';
import Navigation from 'views/components/navigation';
import Sidebar from 'views/components/sidebar';
import PageNotFound from 'views/pages/404';
import { AppModals } from 'views/modal';
import { AppToasts } from 'views/toast';
import { featherIcon } from 'helpers';

const CHAIN_LOADING_TIMEOUT = 3000;

interface ILayoutAttrs {
  scope: string;
}

export const LoadingLayout: m.Component<{}> = {
  view: (vnode) => {
    return m('.mithril-app', [
      app.isLoggedIn() && m(Sidebar),
      m(Navigation),
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

export const Layout: m.Component<ILayoutAttrs, { loadingScope }> = {
  view: (vnode) => {
    const scopeMatchesChain = app.config.nodes.getAll().find((n) => n.chain.id === vnode.attrs.scope);
    const scopeMatchesCommunity = app.config.communities.getAll().find((c) => c.id === vnode.attrs.scope);

    if (!app.loginStatusLoaded()) {
      // Wait for /api/status to return with the user's login status
      return m(LoadingLayout);
    } else if (vnode.attrs.scope && !scopeMatchesChain && !scopeMatchesCommunity) {
      // If /api/status has returned, then app.config.nodes and app.config.communities
      // should both be loaded. If we match neither of them, then we can safely 404
      return m('.mithril-app', [
        app.isLoggedIn() && m(Sidebar),
        m(Navigation),
        m('.layout-content', {
          class: app.isLoggedIn() ? 'logged-in' : 'logged-out'
        }, [
          m('.clear'),
          m(PageNotFound),
        ]),
        m(AppModals),
        m(AppToasts),
      ]);
    } else if (vnode.attrs.scope &&
               vnode.attrs.scope !== app.activeId() &&
               vnode.attrs.scope !== vnode.state.loadingScope) {
      // If we are supposed to load a new chain or community, we do so now
      // This happens only once, and then loadingScope should be set
      vnode.state.loadingScope = vnode.attrs.scope;
      if (scopeMatchesChain) {
        const address = localStorage.getItem('initAddress');
        localStorage.setItem('initAddress', null);
        localStorage.setItem('initChain', null);

        // select the chain
        initChain(vnode.attrs.scope);

        // select the address
        const initAddress = app.login.activeAddresses.filter((a) => a.address === address)[0];
        if (initAddress) selectLogin(initAddress);

        return m(LoadingLayout);
      } else if (scopeMatchesCommunity) {
        const address = localStorage.getItem('initAddress');
        const chain = localStorage.getItem('initChain');
        localStorage.setItem('initAddress', null);
        localStorage.setItem('initChain', null);

        // select the community
        initCommunity(vnode.attrs.scope);

        // select the address
        const initAddress = app.login.activeAddresses.filter((a) => a.address === address && a.chain.id === chain)[0];
        if (initAddress) selectLogin(initAddress);

        return m(LoadingLayout);
      }
    } else if (!vnode.attrs.scope && ((app.chain && app.chain.class) || app.community)) {
      // Handle the case where we unload the chain or community, if we're
      // going to a page that doesn't have one
      deinitChainOrCommunity().then(() => {
        vnode.state.loadingScope = null;
        m.redraw();
      });
      return m(LoadingLayout);
    }

    return m('.mithril-app', [
      app.isLoggedIn() && m(Sidebar),
      m(Navigation),
      m('.layout-content', {
        class: app.isLoggedIn() ? 'logged-in' : 'logged-out'
      }, [
        m('.clear'),
        vnode.children,
      ]),
      m(AppModals),
      m(AppToasts),
    ]);
  }
};
