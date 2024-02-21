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
  newAdminOnboardingEnabled: boolean;
  communityHomepageEnabled: boolean;
  rootDomainRebrandEnabled: boolean;
};

const Router = (customDomain: string) => {
  const client = OpenFeature.getClient();
  const proposalTemplatesEnabled = client.getBooleanValue(
    'proposalTemplates',
    false,
  );
  const newAdminOnboardingEnabled = client.getBooleanValue(
    'newAdminOnboarding',
    false,
  );
  const communityHomepageEnabled = client.getBooleanValue(
    'communityHomepage',
    false,
  );
  const rootDomainRebrandEnabled = client.getBooleanValue(
    'rootDomainRebrand',
    false,
  );
  const flags = {
    proposalTemplatesEnabled,
    newAdminOnboardingEnabled,
    communityHomepageEnabled,
    rootDomainRebrandEnabled,
  };

  return createBrowserRouter(
    createRoutesFromElements([
      ...GeneralRoutes(),
      ...(customDomain ? CustomDomainRoutes(flags) : CommonDomainRoutes(flags)),
      <Route path="*" element={withLayout(PageNotFound, {})} />,
    ]),
  );
};
export default Router;
