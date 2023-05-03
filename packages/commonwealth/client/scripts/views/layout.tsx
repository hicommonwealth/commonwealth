import React, { Suspense, useState } from 'react';

// import type { ClassComponentRouter } from 'mithrilInterop';
import useNecessaryEffect from '../hooks/useNecessaryEffect';

import 'layout.scss';

import {
  deinitChainOrCommunity,
  initChain,
  initNewTokenChain,
  selectChain,
} from 'helpers/chain';

import app from 'state';
import { PageNotFound } from 'views/pages/404';
import { CWEmptyState } from './components/component_kit/cw_empty_state';
import { CWSpinner } from './components/component_kit/cw_spinner';
import { CWText } from './components/component_kit/cw_text';
import withRouter from 'navigation/helpers';
import { useParams } from 'react-router-dom';
import { ChainType } from 'common-common/src/types';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorPage from 'views/pages/error';

const LoadingLayout = () => {
  return (
    <div className="Layout">
      <div className="spinner-container">
        <CWSpinner size="xl" />
      </div>
    </div>
  );
};

const ApplicationError = () => {
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
};

interface ShouldDeferChainAttrs {
  deferChain: boolean;
}

const shouldDeferChainLoading = ({ deferChain }: ShouldDeferChainAttrs) => {
  if (app.chain?.meta.type === ChainType.Token) {
    return false;
  }

  return deferChain;
};

type LayoutAttrs = {
  deferChain?: boolean;
  scope?: string;
  // router?: ClassComponentRouter;
  children: React.ReactNode;
};

/**
 * Handles the app init flow and branch cases
 * --
 * Each logic block is marked with a IFS=Init-Flow-Step comment
 * with a number indicating the order in which they occur
 * Important:
 * - IBS 3 is omitted
 */
const LayoutComponent = ({
  // router,
  children,
  scope: selectedScope,
  deferChain: shouldDeferChain,
}: LayoutAttrs) => {
  const scopeMatchesChain = app.config.chains.getById(selectedScope);
  const scopeIsEthereumAddress =
    selectedScope &&
    selectedScope.startsWith('0x') &&
    selectedScope.length === 42;

  const [scopeToLoad, setScopeToLoad] = useState<string>();
  const [isChainDeferred, setIsChainDeferred] = useState<boolean>();
  const [isLoading, setIsLoading] = useState<boolean>();

  useNecessaryEffect(() => {
    if (selectedScope && selectedScope !== scopeToLoad) {
      // // IFB 3: If the user has navigated to an ethereum address directly,
      // // init a new token chain immediately
      // if (scopeIsEthereumAddress) {
      //   setIsLoading(true);
      //   setScopeToLoad(selectedScope);
      //   initNewTokenChain(selectedScope, router.navigate).finally(() => {
      //     setIsLoading(false);
      //   });
      // } else

      // IFB 5: If scope is different from app.activeChainId() at render
      // time (and we are not loading another community at the same time,
      // via this.loadingScope), set this.loadingScope to the provided scope,
      // and then call selectChain, passing deferChain through. If deferChain
      // is false once selectChain returns, call initChain. Render a LoadingLayout
      // immediately (before selectChain resolves).
      if (selectedScope !== app.activeChainId() && scopeMatchesChain) {
        setIsLoading(true);
        setScopeToLoad(selectedScope);
        setIsChainDeferred(true);
        selectChain(scopeMatchesChain, shouldDeferChain).then((response) => {
          if (!shouldDeferChain && response) {
            initChain().finally(() => {
              setIsLoading(false);
            });
          } else {
            setIsLoading(false);
          }
        });
      }
    }
  }, [
    selectedScope,
    scopeToLoad,
    scopeIsEthereumAddress,
    scopeMatchesChain,
    shouldDeferChain,
  ]);

  useNecessaryEffect(() => {
    // IFB 6: If deferChain is false on the page we’re routing to, but we
    // have loaded with isChainDeferred=true (previously from step 5),
    // then call initChain and render a LoadingLayout immediately.
    if (selectedScope && isChainDeferred && !shouldDeferChain) {
      setIsLoading(true);
      setIsChainDeferred(false);
      initChain().finally(() => {
        setIsLoading(false);
      });
    }
  }, [selectedScope, isChainDeferred, shouldDeferChain]);

  useNecessaryEffect(() => {
    // IFB 7: If scope is not defined (and we are not on a custom domain),
    // deinitialize whatever chain is loaded by calling deinitChainOrCommunity,
    // then set loadingScope to null. Render a LoadingLayout immediately.
    if (
      !selectedScope &&
      !app.isCustomDomain() &&
      app.chain &&
      app.chain.network
    ) {
      setIsLoading(true);
      deinitChainOrCommunity().finally(() => {
        setScopeToLoad(null);
        setIsLoading(false);
      });
    }
  }, [selectedScope]);

  // IFB 1: If initApp() threw an error, show application error.
  if (app.loadingError) {
    return <ApplicationError />;
  }

  // Show loading state for these cases
  // -
  // IFB 2: If initApp() hasn’t finished loading yet
  // -
  // IFB 3: If the user has navigated to an ethereum address directly,
  // init a new token chain immediately and show loading state
  // -
  // IFB 5: If scope is different from app.activeChainId() at render
  // time (and we are not loading another community at the same time,
  // via this.loadingScope), set this.loadingScope to the provided scope,
  // and then call selectChain, passing deferChain through. If deferChain
  // is false once selectChain returns, call initChain. Render a LoadingLayout
  // immediately (before selectChain resolves).
  // -
  // IFB 6: If deferChain is false on the page we’re routing to, but we
  // have loaded with isChainDeferred=true (previously from step 5),
  // then call initChain and render a LoadingLayout immediately.
  // -
  // IFB 7: If scope is not defined (and we are not on a custom domain),
  // deinitialize whatever chain is loaded by calling deinitChainOrCommunity,
  // then set loadingScope to null. Render a LoadingLayout immediately.
  if (
    isLoading ||
    !app.loginStatusLoaded() ||
    // Important: render loading state immediately for IFB 5, 6 and 7
    // For IFB 5
    (selectedScope &&
      selectedScope !== app.activeChainId() &&
      selectedScope !== scopeToLoad) ||
    // For IFB 6
    (selectedScope && isChainDeferred && !shouldDeferChain) ||
    // For IFB 7
    (!selectedScope && !app.isCustomDomain() && app.chain && app.chain.network)
  ) {
    return <LoadingLayout />;
  }

  // IFB 4: If the user has attempted to a community page that was not
  // found on the list of communities from /status, show a 404 page.
  if (selectedScope && !scopeMatchesChain && !scopeIsEthereumAddress) {
    return (
      <div className="Layout">
        <PageNotFound />
      </div>
    );
  }

  // IFB 8: No pending branch case - Render the inner page as passed by router
  return <div className="Layout">{children}</div>;
};

export const LayoutWrapper = ({ Component, params }) => {
  const routerParams = useParams();
  const LayoutComp = withRouter(LayoutComponent);

  const pathScope = routerParams?.scope?.toString() || app.customDomainId();
  const scope = params.scoped ? pathScope : null;
  const deferChain = shouldDeferChainLoading({
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
