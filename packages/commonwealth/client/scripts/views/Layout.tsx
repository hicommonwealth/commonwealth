import 'Layout.scss';
import { deinitChainOrCommunity, selectCommunity } from 'helpers/chain';
import withRouter, { useCommonNavigate } from 'navigation/helpers';
import React, { ReactNode, Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Helmet } from 'react-helmet-async';
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
  const navigate = useCommonNavigate();
  const routerParams = useParams();
  const pathScope = routerParams?.scope?.toString() || app.customDomainId();
  const selectedScope = scoped ? pathScope : null;

  const [scopeToLoad, setScopeToLoad] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>();

  // If community id was updated ex: `commonwealth.im/{community-id}/**/*`
  // redirect to new community id ex: `commonwealth.im/{new-community-id}/**/*`
  useNecessaryEffect(() => {
    const redirectTo = app.config.redirects[selectedScope];
    if (redirectTo && redirectTo !== selectedScope.toLowerCase()) {
      const path = window.location.href.split(selectedScope);
      navigate(`/${redirectTo}${path.length > 1 ? path[1] : ''}`);
      return;
    }
  }, [selectedScope]);

  const scopeMatchesCommunity = app.config.chains.getById(selectedScope);

  // If the navigated-to community scope differs from the active chain id at render time,
  // and we have not begun loading the new navigated-to community data, shouldSelectChain is
  // set to true, and the navigated-to scope is loaded.
  const shouldSelectChain =
    selectedScope &&
    selectedScope !== app.activeChainId() &&
    selectedScope !== scopeToLoad &&
    scopeMatchesCommunity;

  useNecessaryEffect(() => {
    (async () => {
      if (shouldSelectChain) {
        setIsLoading(true);
        setScopeToLoad(selectedScope);
        await selectCommunity(scopeMatchesCommunity);
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
    const pageNotFound = selectedScope && !scopeMatchesCommunity;
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
      <Helmet>
        <meta name="title" content="Common" />
        <meta
          name="description"
          content="Discuss, organize, and grow decentralized communities"
        />
        <meta name="author" content="" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Common" />
        <meta name="twitter:site" content="@hicommonwealth" />
        <meta
          name="twitter:description"
          content="Discuss, organize, and grow decentralized communities"
        />
        <meta
          name="twitter:image:src"
          content="https://commonwealth.im/static/img/branding/common.png"
        />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Common" />
        <meta property="og:url" content="https://commonwealth.im" />
        <meta property="og:title" content="Common" />
        <meta
          property="og:description"
          content="Discuss, organize, and grow decentralized communities"
        />
        <meta
          property="og:image"
          content="https://commonwealth.im/static/img/branding/common.png"
        />
      </Helmet>
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
