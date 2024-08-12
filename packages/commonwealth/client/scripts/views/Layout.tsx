import 'Layout.scss';
import { deinitChainOrCommunity, loadCommunityChainInfo } from 'helpers/chain';
import withRouter, { useCommonNavigate } from 'navigation/helpers';
import React, { ReactNode, Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useParams } from 'react-router-dom';
import app from 'state';
import { useFetchConfigurationQuery } from 'state/api/configuration';
import { PageNotFound } from 'views/pages/404';
import ErrorPage from 'views/pages/error';
import useNecessaryEffect from '../hooks/useNecessaryEffect';
import ChainInfo from '../models/ChainInfo';
import { useGetCommunityByIdQuery } from '../state/api/communities';
import { useUpdateUserActiveCommunityMutation } from '../state/api/user';
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
  const pathScope = routerParams?.scope?.toString() || app.customDomainId();
  const providedCommunityScope = scoped ? pathScope : null;

  const [communityToLoad, setCommunityToLoad] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>();

  const { mutateAsync: updateActiveCommunity } =
    useUpdateUserActiveCommunityMutation();
  const { data: configurationData } = useFetchConfigurationQuery();

  // If community id was updated ex: `commonwealth.im/{community-id}/**/*`
  // redirect to new community id ex: `commonwealth.im/{new-community-id}/**/*`
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
    community &&
    !isVerifyingCommunityExistance;

  useNecessaryEffect(() => {
    (async () => {
      if (shouldSelectChain) {
        setIsLoading(true);
        setCommunityToLoad(providedCommunityScope);
        if (
          await loadCommunityChainInfo(
            // TODO: 8811 cleanup `ChainInfo`
            ChainInfo.fromJSON({
              Addresses: community.Addresses,
              admin_only_polling: community.admin_only_polling,
              base: community.base,
              bech32_prefix: community.bech32_prefix,
              block_explorer_ids: community.block_explorer_ids,
              chain_node_id: community.chain_node_id,
              ChainNode: community.ChainNode,
              collapsed_on_homepage: community.collapsed_on_homepage,
              CommunityStakes: community.CommunityStakes,
              CommunityTags: community.CommunityTags,
              custom_domain: community.custom_domain,
              custom_stages: community.custom_stages,
              default_page: community.default_page,
              default_summary_view: community.default_summary_view,
              default_symbol: community.default_symbol,
              description: community.description,
              directory_page_chain_node_id:
                community.directory_page_chain_node_id,
              directory_page_enabled: community.directory_page_enabled,
              discord_bot_webhooks_enabled:
                community.discord_bot_webhooks_enabled,
              token_name: community.token_name,
              has_homepage: community.has_homepage,
              discord_config_id: community.discord_config_id,
              icon_url: community.icon_url,
              name: community.name,
              id: community.id,
              redirect: community.redirect,
              namespace: community.namespace,
              network: community.network,
              snapshot_spaces: community.snapshot_spaces,
              stages_enabled: community.stages_enabled,
              terms: community.terms,
              thread_count: community.numTotalThreads,
              social_links: community.social_links,
              ss58_prefix: community.ss58_prefix,
              substrate_spec: community.substrate_spec,
              type: community.type,
              adminsAndMods: community?.adminsAndMods || [],
              communityBanner: community?.communityBanner || '',
              // these don't come from /communities/:id response and need to be added in
              // api response when needed
              Contracts: [],
              profile_count: 0,
            }),
          )
        ) {
          // Update default community on server if logged in
          if (app.isLoggedIn()) {
            await updateActiveCommunity({
              communityId: community?.id || '',
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
    !app.isCustomDomain() &&
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
