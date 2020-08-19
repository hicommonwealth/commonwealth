import 'layout.scss';

import m from 'mithril';
import $ from 'jquery';
import { EmptyState, Icons } from 'construct-ui';

import { initChain, initCommunity, deinitChainOrCommunity, selectNode } from 'app';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import PageNotFound from 'views/pages/404';
import Sidebar from 'views/components/sidebar';
import { AppModals } from 'views/modal';
import AppToasts from 'views/toast';
import { featherIcon } from 'helpers';

const CHAIN_LOADING_TIMEOUT = 3000;

export const LoadingLayout: m.Component<{}> = {
  view: (vnode) => {
    return m('.Layout.LoadingLayout.mithril-app', [
      m(Sidebar),
      m('.layout-container', [
        m('.LoadingLayout'),
      ]),
      m(AppModals),
      m(AppToasts),
    ]);
  }
};

export const Layout: m.Component<{ scope: string, deferChain?: boolean }, { loadingScope, deferred }> = {
  view: (vnode) => {
    const { scope, deferChain } = vnode.attrs;
    const scopeMatchesChain = app.config.nodes.getAll().find((n) => n.chain.id === scope);
    const scopeMatchesCommunity = app.config.communities.getAll().find((c) => c.id === scope);

    if (app.loadingError) {
      return m('.Layout.mithril-app', [
        m(Sidebar),
        m('.layout-container', [
          m(EmptyState, {
            fill: true,
            icon: Icons.X,
            content: [
              m('p', `Application error: ${app.loadingError}`),
              m('p', 'Please try again at another time'),
            ],
            style: 'color: #546e7b;'
          }),
        ]),
        m(AppModals),
        m(AppToasts),
      ]);
    } else if (!app.loginStatusLoaded()) {
      // Wait for /api/status to return with the user's login status
      return m(LoadingLayout);
    } else if (scope && !scopeMatchesChain && !scopeMatchesCommunity) {
      // If /api/status has returned, then app.config.nodes and app.config.communities
      // should both be loaded. If we match neither of them, then we can safely 404
      return m('.Layout.mithril-app', [
        m(Sidebar),
        m('.layout-container', [
          m(PageNotFound)
        ]),
        m(AppModals),
        m(AppToasts),
      ]);
    } else if (scope && scope !== app.activeId() && scope !== vnode.state.loadingScope) {
      // If we are supposed to load a new chain or community, we do so now
      // This happens only once, and then loadingScope should be set
      vnode.state.loadingScope = scope;
      if (scopeMatchesChain) {
        vnode.state.deferred = deferChain;
        selectNode(scopeMatchesChain, deferChain).then(() => {
          if (!deferChain) {
            initChain();
          }
        });
        return m(LoadingLayout);
      } else if (scopeMatchesCommunity) {
        initCommunity(scope);
        return m(LoadingLayout);
      }
    } else if (scope && vnode.state.deferred && !deferChain) {
      vnode.state.deferred = false;
      initChain();
      return m(LoadingLayout);
    } else if (!scope && ((app.chain && app.chain.class) || app.community)) {
      // Handle the case where we unload the chain or community, if we're
      // going to a page that doesn't have one
      deinitChainOrCommunity().then(() => {
        vnode.state.loadingScope = null;
        m.redraw();
      });
      return m(LoadingLayout);
    }

    return m('.Layout.mithril-app', [
      m(Sidebar),
      m('.layout-container', [
        vnode.children
      ]),
      m(AppModals),
      m(AppToasts),
    ]);
  }
};
