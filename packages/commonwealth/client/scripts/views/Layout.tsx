import 'Layout.scss';
import { deinitChainOrCommunity, selectChain } from 'helpers/chain';
import withRouter from 'navigation/helpers';
import React, { ReactNode, Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useParams } from 'react-router-dom';
import app from 'state';
import { PageNotFound } from 'views/pages/404';
import ErrorPage from 'views/pages/error';
import useNecessaryEffect from '../hooks/useNecessaryEffect';
import SubLayout from './Sublayout';
import { CWEmptyState } from './components/component_kit/cw_empty_state';
import { CWText } from './components/component_kit/cw_text';
import CWCircleMultiplySpinner from './components/component_kit/new_designs/CWCircleMultiplySpinner';

type LayoutAttrs = {
  Component: ReactNode | any;
  scoped?: boolean;
  type:
    | 'community' // Community-scoped layout with a header, CW sidebar, & community sidebar.
    | 'common' // Generic layout with header and CW sidebar, used for non-community-scoped pages.
    | 'blank'; //  Blank layout using Layout.scss styles
};

// For complete documentation, see the App-Initialization-Flow.md wiki entry.
const LayoutComponent = ({
  Component, // Child component being rendered
  scoped = false,
  type = 'community',
}: LayoutAttrs) => {
  const routerParams = useParams();
  const pathScope = routerParams?.scope?.toString() || app.customDomainId();
  const selectedScope = scoped ? pathScope : null;

  const [scopeToLoad, setScopeToLoad] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>();

  const scopeMatchesChain = app.config.chains.getById(selectedScope);

  // If the navigated-to community scope differs from the active chain id at render time,
  // and we have not begun loading the new navigated-to community data, shouldSelectChain is
  // set to true, and the navigated-to scope is loaded.
  const shouldSelectChain =
    selectedScope &&
    selectedScope !== app.activeChainId() &&
    selectedScope !== scopeToLoad &&
    scopeMatchesChain;

  useNecessaryEffect(() => {
    (async () => {
      if (shouldSelectChain) {
        setIsLoading(true);
        setScopeToLoad(selectedScope);
        await selectChain(scopeMatchesChain);
        setIsLoading(false);
      }
    })();
  }, [shouldSelectChain]);

  // If scope is not defined (and we are not on a custom domain), deinitialize the loaded chain
  // with deinitChainOrCommunity(), then set loadingScope to null and render a LoadingLayout.
  const shouldDeInitChain =
    !selectedScope && !app.isCustomDomain() && app.chain && app.chain.network;

  useNecessaryEffect(() => {
    (async () => {
      if (shouldDeInitChain) {
        setIsLoading(true);
        await deinitChainOrCommunity();
        setScopeToLoad(null);
        setIsLoading(false);
      }
    })();
  }, [shouldDeInitChain]);

  // A loading state (i.e. spinner) is shown in the following cases:
  // - user login status has not finished loaded
  // - a community is still being initialized or deinitialized
  const shouldShowLoadingState =
    isLoading ||
    !app.loginStatusLoaded() ||
    shouldSelectChain ||
    shouldDeInitChain;

  const childToRender = () => {
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
        <CWCircleMultiplySpinner />
      </div>
    );

    if (shouldShowLoadingState) return Bobber;

    // If attempting to navigate to a community not fetched by the /status query, return a 404
    const pageNotFound = selectedScope && !scopeMatchesChain;
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
          <SubLayout isInsideCommunity={type === 'community'}>
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
