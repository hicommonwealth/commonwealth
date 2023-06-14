import { deinitChainOrCommunity, selectChain } from 'helpers/chain';
import 'Layout.scss';
import withRouter from 'navigation/helpers';
import React, { useState, ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useParams } from 'react-router-dom';
import app from 'state';
import { PageNotFound } from 'views/pages/404';
import ErrorPage from 'views/pages/error';
import useNecessaryEffect from '../hooks/useNecessaryEffect';
import { CWEmptyState } from './components/component_kit/cw_empty_state';
import { CWSpinner } from './components/component_kit/cw_spinner';
import { CWText } from './components/component_kit/cw_text';
import SubLayout from './Sublayout';

type LayoutAttrs = {
  Component: ReactNode | any;
  scoped?: boolean;
  type:
    | 'community' // community specific layout with header, commonwealth sidebar and community sidebar - used for cw community owned pages
    | 'common' // common wealth layout with header and commonwealth sidebar - used for cw self owned pages
    | 'blank'; //  a blank layout with just the layout styles
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
  Component, // the component to render
  scoped = false,
  type = 'community',
}: LayoutAttrs) => {
  const routerParams = useParams();
  const pathScope = routerParams?.scope?.toString() || app.customDomainId();
  const selectedScope = scoped ? pathScope : null;

  const [scopeToLoad, setScopeToLoad] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>();

  const scopeMatchesChain = app.config.chains.getById(selectedScope);

  // IFB 5: If scope is different from app.activeChainId() at render
  // time (and we are not loading another community at the same time,
  // via this.loadingScope), set this.loadingScope to the provided scope,
  // and then call selectChain, passing deferChain through. If deferChain
  // is false once selectChain returns, call initChain. Render a LoadingLayout
  // immediately (before selectChain resolves).
  const shouldSelectChain =
    selectedScope &&
    selectedScope !== app.activeChainId() &&
    selectedScope !== scopeToLoad &&
    scopeMatchesChain;

  // IFB 7: If scope is not defined (and we are not on a custom domain),
  // deinitialize whatever chain is loaded by calling deinitChainOrCommunity,
  // then set loadingScope to null. Render a LoadingLayout immediately.
  const shouldDeInitChain =
    !selectedScope && !app.isCustomDomain() && app.chain && app.chain.network;

  useNecessaryEffect(() => {
    (async () => {
      if (shouldSelectChain) {
        // IFB 5
        setIsLoading(true);
        setScopeToLoad(selectedScope);
        await selectChain(scopeMatchesChain);
        setIsLoading(false);
      }
    })();
  }, [shouldSelectChain]);

  useNecessaryEffect(() => {
    (async () => {
      // IFB 7
      if (shouldDeInitChain) {
        setIsLoading(true);
        await deinitChainOrCommunity();
        setScopeToLoad(null);
        setIsLoading(false);
      }
    })();
  }, [shouldDeInitChain]);

  // Show loading state for these cases
  // -
  // IFB 2: If initApp() hasn’t finished loading yet
  // -
  // IFB 3: If the user has navigated to an ethereum address directly,
  // init a new token chain immediately and show loading state
  // -
  // IFB 5
  // -
  // IFB 6
  // -
  // IFB 7
  const shouldShowLoadingState =
    isLoading || // general loading
    !app.loginStatusLoaded() || // IFB 2
    // Important: render loading state immediately for IFB 5, 6 and 7, general
    // loading will take over later
    shouldSelectChain || // IFB 5
    shouldDeInitChain; // IFB 7

  // IFB 4: If the user has attempted to a community page that was not
  // found on the list of communities from /status, show a 404 page.
  const pageNotFound = selectedScope && !scopeMatchesChain;

  // IFB 8: No pending branch case - Render the inner page as passed by router
  const childToRender = () => {
    // IFB 1: If initApp() threw an error, show application error.
    if (app.loadingError) {
      return (
        <CWEmptyState
          iconName="cautionTriangle"
          content={
            <div className="loading-error">
              <CWText>Application error: {app.loadingError}</CWText>
              <CWText>Please try again later</CWText>
            </div>
          }
        />
      );
    }

    const Bobber = (
      <div className="spinner-container">
        <CWSpinner size="xl" />
      </div>
    );

    if (shouldShowLoadingState) return Bobber;

    return (
      <Suspense fallback={Bobber}>
        {pageNotFound ? <PageNotFound /> : <Component {...routerParams} />}
      </Suspense>
    );
  };

  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => <ErrorPage message={error?.message} />}
    >
      <div className="Layout">
        {type === 'blank' ? (
          childToRender()
        ) : (
          <SubLayout hasCommunitySidebar={type === 'community'}>
            {childToRender()}
          </SubLayout>
        )}
      </div>
    </ErrorBoundary>
  );
};

export const withLayout = (Component, params) => {
  const LayoutWrapper = withRouter(LayoutComponent);
  return <LayoutWrapper Component={Component} {...params} />;
};
