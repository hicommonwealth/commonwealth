import { OpenFeature } from '@openfeature/web-sdk';
import CustomDomainRoutes from 'navigation/CustomDomainRoutes';
import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import { withLayout } from 'views/Layout';
import { PageNotFound } from 'views/pages/404';
import CommonDomainRoutes from './CommonDomainRoutes';
import GeneralRoutes from './GeneralRoutes';

export type RouteFeatureFlags = {
  proposalTemplatesEnabled: boolean;
  communityHomepageEnabled: boolean;
  myCommunityStakePageEnabled: boolean;
  existingCommunityStakeIntegrationEnabled: boolean;
};

const Router = (customDomain: string) => {
  const client = OpenFeature.getClient();
  const proposalTemplatesEnabled = client.getBooleanValue(
    'proposalTemplates',
    false,
  );
  const communityHomepageEnabled = client.getBooleanValue(
    'communityHomepage',
    false,
  );
  const myCommunityStakePageEnabled = client.getBooleanValue(
    'myCommunityStakePageEnabled',
    false,
  );
  const existingCommunityStakeIntegrationEnabled = client.getBooleanValue(
    'existingCommunityStakeIntegrationEnabled',
    false,
  );
  const flags = {
    proposalTemplatesEnabled,
    communityHomepageEnabled,
    myCommunityStakePageEnabled,
    existingCommunityStakeIntegrationEnabled,
  };

  return createBrowserRouter(
    createRoutesFromElements([
      ...GeneralRoutes(),
      ...(customDomain ? CustomDomainRoutes(flags) : CommonDomainRoutes(flags)),
      <Route key="routes" path="*" element={withLayout(PageNotFound, {})} />,
    ]),
  );
};
export default Router;
