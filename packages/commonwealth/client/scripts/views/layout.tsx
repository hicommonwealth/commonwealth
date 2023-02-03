/* @jsx jsx */
import React from 'react';

import { ClassComponent, ResultNode, redraw, jsx } from 'mithrilInterop';

import 'index.scss'; // have to inject here instead of app.ts or else fonts don't load
import 'layout.scss';

import {
  deinitChainOrCommunity,
  initChain,
  initNewTokenChain,
  selectChain,
} from 'helpers/chain';

import 'index.scss'; // have to inject here instead of app.ts or else fonts don't load
import 'layout.scss';
import app from 'state';
import PageNotFound from 'views/pages/404';
import { AppToasts } from 'views/toast';
import { CWEmptyState } from './components/component_kit/cw_empty_state';
import { CWSpinner } from './components/component_kit/cw_spinner';
import { CWText } from './components/component_kit/cw_text';
import { useParams } from 'react-router-dom';

export const withRouter = (WrappedComponent) => (props) => {
  const params = useParams();
  return <WrappedComponent {...props} params={params} />;
};

class LoadingLayout extends ClassComponent {
  view() {
    return (
      <div className="Layout">
        <div className="spinner-container">
          <CWSpinner size="xl" />
        </div>
        {/*<AppModals />*/}
        <AppToasts />
      </div>
    );
  }
}

type LayoutAttrs = {
  deferChain?: boolean;
  hideSidebar?: boolean;
  scope?: string;
  initFn?: Function;
  params?;
};

class LayoutComponent extends ClassComponent<LayoutAttrs> {
  private loadingScope: string;
  private deferred: boolean;
  private surveyDelayTriggered = false;
  private surveyReadyForDisplay = false;

  oninit(vnode: ResultNode<LayoutAttrs>) {
    if (vnode.attrs.initFn) {
      vnode.attrs.initFn().then(() => this.redraw());
    }
  }

  view(vnode: ResultNode<LayoutAttrs>) {
    const { deferChain, params: { scope } = {} } = vnode.attrs;
    const scopeIsEthereumAddress =
      scope && scope.startsWith('0x') && scope.length === 42;
    const scopeMatchesChain = app.config.chains.getById(scope);

    // Put the survey on a timer so it doesn't immediately appear
    if (!this.surveyDelayTriggered && !this.surveyReadyForDisplay) {
      this.surveyDelayTriggered = true;
      setTimeout(() => {
        this.surveyReadyForDisplay = true;
      }, 4000);
    }

    if (app.loadingError) {
      return (
        <div className="Layout">
          <CWEmptyState
            iconName="cautionTriangle"
            content={
              <div className="loading-error">
                <CWText>Application error: {app.loadingError}</CWText>
                <CWText>Please try again later</CWText>
              </div>
            }
          />
          {/*<AppModals />*/}
          <AppToasts />
        </div>
      );
    } else if (!app.loginStatusLoaded()) {
      // Wait for /api/status to return with the user's login status
      return <LoadingLayout />;
    } else if (scope && scopeIsEthereumAddress && scope !== this.loadingScope) {
      this.loadingScope = scope;
      initNewTokenChain(scope);
      return <LoadingLayout />;
    } else if (scope && !scopeMatchesChain && !scopeIsEthereumAddress) {
      // If /api/status has returned, then app.config.nodes and app.config.communities
      // should both be loaded. If we match neither of them, then we can safely 404
      return (
        <div className="Layout">
          <PageNotFound />
          {/*<AppModals />*/}
          <AppToasts />
        </div>
      );
    } else if (
      scope &&
      scope !== app.activeChainId() &&
      scope !== this.loadingScope
    ) {
      // If we are supposed to load a new chain or community, we do so now
      // This happens only once, and then loadingScope should be set
      this.loadingScope = scope;
      if (scopeMatchesChain) {
        this.deferred = deferChain;
        selectChain(scopeMatchesChain, deferChain).then((response) => {
          if (!deferChain && response) {
            initChain().then(() => this.redraw());
          } else {
            this.redraw();
          }
        });
        return <LoadingLayout />;
      }
    } else if (scope && this.deferred && !deferChain) {
      this.deferred = false;
      initChain().then(() => this.redraw());
      return <LoadingLayout />;
    } else if (!scope && app.chain && app.chain.network) {
      // Handle the case where we unload the network or community, if we're
      // going to a page that doesn't have one
      // Include this in if for isCustomDomain, scope gets unset on redirect
      // We don't need this to happen
      if (!app.isCustomDomain()) {
        deinitChainOrCommunity().then(() => {
          this.loadingScope = null;
          redraw();
        });
      }
      return <LoadingLayout />;
    }
    return (
      <div className="Layout">
        {vnode.children}
        {/*<AppModals />*/}
        <AppToasts />
        {/*<UserSurveyPopup surveyReadyForDisplay={this.surveyReadyForDisplay} />*/}
      </div>
    );
  }
}

export const Layout = LayoutComponent;
// export const Layout = withRouter(LayoutComponent);
