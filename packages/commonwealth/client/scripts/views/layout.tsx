import { ChainType } from 'common-common/src/types';

import { deinitChainOrCommunity, initChain, initNewTokenChain, selectChain, } from 'helpers/chain';

import 'layout.scss';

import type { ClassComponentRouter, ResultNode } from 'mithrilInterop';
import { ClassComponent, redraw } from 'mithrilInterop';
import withRouter from 'navigation/helpers';
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useParams } from 'react-router-dom';

import app from 'state';
import { PageNotFound } from 'views/pages/404';
import ErrorPage from 'views/pages/error';
import { CWEmptyState } from './components/component_kit/cw_empty_state';
import { CWSpinner } from './components/component_kit/cw_spinner';
import { CWText } from './components/component_kit/cw_text';

const LoadingLayout = () => {
  return (
    <div className="Layout">
      <div className="spinner-container">
        <CWSpinner size="xl" />
      </div>
    </div>
  );
};

interface ShouldDeferChainAttrs {
  deferChain: boolean;
}

const shouldDeferChain = ({ deferChain }: ShouldDeferChainAttrs) => {
  if (app.chain?.meta.type === ChainType.Token) {
    return false;
  }

  return deferChain;
};

type LayoutAttrs = {
  deferChain?: boolean;
  scope?: string;
  router?: ClassComponentRouter;
  children: React.ReactNode;
};

class LayoutComponent extends ClassComponent<LayoutAttrs> {
  private loadingScope: string;
  private deferred: boolean;
  private surveyDelayTriggered = false;
  private surveyReadyForDisplay = false;

  view(vnode: ResultNode<LayoutAttrs>) {
    const { scope, deferChain, router } = vnode.attrs;

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
        </div>
      );
    }

    if (!app.loginStatusLoaded()) {
      // Wait for /api/status to return with the user's login status
      return <LoadingLayout />;
    }

    if (scope && scopeIsEthereumAddress && scope !== this.loadingScope) {
      this.loadingScope = scope;
      initNewTokenChain(scope, router.navigate);
      return <LoadingLayout />;
    }

    if (scope && !scopeMatchesChain && !scopeIsEthereumAddress) {
      // If /api/status has returned, then app.config.nodes and app.config.communities
      // should both be loaded. If we match neither of them, then we can safely 404
      return (
        <div className="Layout">
          <PageNotFound />
        </div>
      );
    }

    if (scope && scope !== app.activeChainId() && scope !== this.loadingScope) {
      // If we are supposed to load a new chain or community, we do so now
      // This happens only once, and then loadingScope should be set
      this.loadingScope = scope;
      if (scopeMatchesChain) {
        this.deferred = deferChain;
        selectChain(scopeMatchesChain, deferChain).then((response) => {
          if (!deferChain && response) {
            initChain().then(() => {
              this.redraw();
            });
          } else {
            this.redraw();
          }
        });
        return <LoadingLayout />;
      }
    }

    if (scope && this.deferred && !deferChain) {
      this.deferred = false;
      initChain().then(() => {
        this.redraw();
      });
      return <LoadingLayout />;
    }

    if (!scope && app.chain && app.chain.network) {
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
        {/*<UserSurveyPopup surveyReadyForDisplay={this.surveyReadyForDisplay} />*/}
      </div>
    );
  }
}

export const LayoutWrapper = ({ Component, params }) => {
  const routerParams = useParams();
  const LayoutComp = withRouter(LayoutComponent);

  const pathScope = routerParams?.scope?.toString() || app.customDomainId();
  const scope = params.scoped ? pathScope : null;
  const deferChain = shouldDeferChain({
    deferChain: params.deferChain,
  });

  return (
    <LayoutComp scope={scope} deferChain={deferChain}>
      <Component {...routerParams} />
    </LayoutComp>
  );
};

export const withLayout = (Component, params) => {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => <ErrorPage message={error?.message} />}
    >
      <Suspense fallback={null}>
        <LayoutWrapper Component={Component} params={params} />
      </Suspense>
    </ErrorBoundary>
  );
};
