import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { deinitChainOrCommunity, loadCommunityChainInfo } from 'helpers/chain';
import withRouter, { useCommonNavigate } from 'navigation/helpers';
import React, { ReactNode, Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useParams } from 'react-router-dom';
import app from 'state';
import {
  useFetchConfigurationQuery,
  useFetchCustomDomainQuery,
} from 'state/api/configuration';
import useErrorStore from 'state/ui/error';
import useUserStore from 'state/ui/user';
import { PageNotFound } from 'views/pages/404';
import ErrorPage from 'views/pages/error';
import { z } from 'zod';
import useAppStatus from '../hooks/useAppStatus';
import useNecessaryEffect from '../hooks/useNecessaryEffect';
import { useGetCommunityByIdQuery } from '../state/api/communities';
import { useUpdateUserActiveCommunityMutation } from '../state/api/user';
import './Layout.scss';
import SubLayout from './Sublayout';
import MetaTags from './components/MetaTags';
import { CWEmptyState } from './components/component_kit/cw_empty_state';
import { CWText } from './components/component_kit/cw_text';
import CWCircleMultiplySpinner from './components/component_kit/new_designs/CWCircleMultiplySpinner';

type LayoutAttrs = {
  Component: ReactNode | any;
  scoped?: boolean;
  renderDefaultMetatags?: boolean;
  type?:
    | 'community' // Community-scoped layout with a header, CW sidebar, & community sidebar.
    | 'common' // Generic layout with header and CW sidebar, used for non-community-scoped pages.
    | 'blank'; //  Blank layout using Layout.scss styles
};

// For complete documentation, see the App-Initialization-Flow.md wiki entry.
const LayoutComponent = ({
  Component, // Child component being rendered
  scoped = false,
  renderDefaultMetatags = true,
  type = 'community',
}: LayoutAttrs) => {
  const navigate = useCommonNavigate();
  const routerParams = useParams();

  const { data: domain } = useFetchCustomDomainQuery();

  const pathScope = routerParams?.scope?.toString() || domain?.customDomainId;
  const providedCommunityScope = scoped ? pathScope : null;
  const user = useUserStore();
  const appError = useErrorStore();

  const [communityToLoad, setCommunityToLoad] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>();

  const { mutateAsync: updateActiveCommunity } =
    useUpdateUserActiveCommunityMutation();
  const { data: configurationData } = useFetchConfigurationQuery();

  const { isAddedToHomeScreen } = useAppStatus();

  //this prevents rerender when user is updated
  useEffect(() => {
    if (user.isOnPWA !== isAddedToHomeScreen) {
      user.setData({ isOnPWA: isAddedToHomeScreen });
    }
  }, [isAddedToHomeScreen, user.isOnPWA, user]);

  // If community id was updated ex: `${PRODUCTION_DOMAIN}/{community-id}/**/*`
  // redirect to new community id ex: `${PRODUCTION_DOMAIN}/{new-community-id}/**/*`
  useNecessaryEffect(() => {
    // @ts-expect-error <StrictNullChecks/>
    const redirectTo = configurationData?.redirects?.[providedCommunityScope];
    // @ts-expect-error <StrictNullChecks/>
    if (redirectTo && redirectTo !== providedCommunityScope.toLowerCase()) {
      // @ts-expect-error <StrictNullChecks/>
      const path = window.location.href.split(providedCommunityScope);
      navigate(`/${redirectTo}${path.length > 1 ? path[1] : ''}`);
      return;
    }
  }, [providedCommunityScope]);

  const { data: community, isLoading: isVerifyingCommunityExistance } =
    useGetCommunityByIdQuery({
      id: providedCommunityScope || '',
      includeNodeInfo: true,
      enabled: !!providedCommunityScope,
    });

  // If the navigated-to community scope differs from the active chain id at render time,
  // and we have not begun loading the new navigated-to community data, shouldSelectChain is
  // set to true, and the navigated-to scope is loaded.
  const shouldSelectChain =
    providedCommunityScope &&
    providedCommunityScope !== app.activeChainId() &&
    providedCommunityScope !== communityToLoad &&
    !!community &&
    !isVerifyingCommunityExistance;

  useNecessaryEffect(() => {
    (async () => {
      if (shouldSelectChain) {
        setIsLoading(true);
        setCommunityToLoad(providedCommunityScope);
        const communityFromTRPCResponse = community as z.infer<
          typeof ExtendedCommunity
        >;
        if (await loadCommunityChainInfo(communityFromTRPCResponse)) {
          // Update default community on server and app, if logged in
          if (user.isLoggedIn) {
            await updateActiveCommunity({
              communityId: community?.id || '',
            });

            user.setData({
              activeCommunity: communityFromTRPCResponse,
            });
          }
        }
        setIsLoading(false);
      }
    })();
  }, [shouldSelectChain]);

  // If scope is not defined (and we are not on a custom domain), deinitialize the loaded chain
  // with deinitChainOrCommunity(), then set loadingScope to null and render a LoadingLayout.
  const shouldDeInitChain =
    !providedCommunityScope &&
    !domain?.isCustomDomain &&
    app.chain &&
    app.chain.network;

  useNecessaryEffect(() => {
    (async () => {
      if (shouldDeInitChain) {
        setIsLoading(true);
        await deinitChainOrCommunity();
        setCommunityToLoad(undefined);
        setIsLoading(false);
      }
    })();
  }, [shouldDeInitChain]);

  // A loading state (i.e. spinner) is shown in the following cases:
  // - a community is still being initialized or deinitialized
  const shouldShowLoadingState =
    isLoading ||
    shouldSelectChain ||
    shouldDeInitChain ||
    (providedCommunityScope ? isVerifyingCommunityExistance : false);

  const childToRender = () => {
    if (appError.loadingError) {
      return (
        <CWEmptyState
          iconName="cautionTriangle"
          content={
            <div className="loading-error">
              <CWText>Application error: {appError.loadingError}</CWText>
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
    const pageNotFound =
      providedCommunityScope && !community && !isVerifyingCommunityExistance;
    return (
      <Suspense fallback={Bobber}>
        {pageNotFound ? <PageNotFound /> : <Component {...routerParams} />}
      </Suspense>
    );
  };

  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <ErrorPage message={error?.message} data-testid="app-error" />
      )}
    >
      {renderDefaultMetatags && <MetaTags />}
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

export const withLayout = (
  Component,
  params: Omit<LayoutAttrs, 'Component'>,
) => {
  const LayoutWrapper = withRouter(LayoutComponent);
  return <LayoutWrapper Component={Component} {...params} />;
};
