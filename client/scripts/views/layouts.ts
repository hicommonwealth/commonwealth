import 'layout.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';

import { initChain, initCommunity, deinitChainOrCommunity } from 'app';
import { default as app } from 'state';
import { notifyError } from 'controllers/app/notifications';
import Header from 'views/components/header';
import Footer from 'views/components/footer';
// import CommunityChat from 'views/components/community_chat';
import PageNotFound from 'views/pages/404';
import { AppModals } from 'views/modal';
import { featherIcon } from 'helpers';

const CHAIN_LOADING_TIMEOUT = 3000;

interface ILayoutAttrs {
  scope: string;
}

export const LoadingLayout: m.Component<{}> = {
  view: (vnode) => {
    return m('.mithril-app', [
      m(Header),
      m('.LoadingLayout'),
      m(AppModals),
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
        m(Header),
        m('.clear'),
        m(PageNotFound),
        m(Footer),
        m(AppModals),
      ]);
    } else if (vnode.attrs.scope &&
               vnode.attrs.scope !== app.activeId() &&
               vnode.attrs.scope !== vnode.state.loadingScope) {
      // If we are supposed to load a new chain or community, we do so now
      // This happens only once, and then loadingScope should be set
      vnode.state.loadingScope = vnode.attrs.scope;
      if (scopeMatchesChain) {
        initChain(vnode.attrs.scope);
        return m(LoadingLayout);
      } else if (scopeMatchesCommunity) {
        initCommunity(vnode.attrs.scope);
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
      m(Header),
      m('.clear'),
      vnode.children,
      m(Footer),
      // m(CommunityChat),
      m(AppModals),
    ]);
  }
};
