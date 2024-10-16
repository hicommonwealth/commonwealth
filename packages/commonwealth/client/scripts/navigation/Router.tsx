import { OpenFeature } from '@openfeature/web-sdk';
import CustomDomainRoutes from 'navigation/CustomDomainRoutes';
import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import { fetchCachedCustomDomain } from 'state/api/configuration';
import { withLayout } from 'views/Layout';
import { PageNotFound } from 'views/pages/404';
import CommonDomainRoutes from './CommonDomainRoutes';
import GeneralRoutes from './GeneralRoutes';

export type RouteFeatureFlags = {
  contestEnabled: boolean;
  weightedTopicsEnabled: boolean;
  tokenizedCommunityEnabled: boolean;
};

const Router = () => {
  const client = OpenFeature.getClient();
  const contestEnabled = client.getBooleanValue('contest', false);

  const weightedTopicsEnabled = client.getBooleanValue('weightedTopics', false);

  const tokenizedCommunityEnabled = client.getBooleanValue(
    'tokenizedCommunity',
    false,
  );

  const flags = {
    contestEnabled,
    weightedTopicsEnabled,
    tokenizedCommunityEnabled,
  };

  const { isCustomDomain } = fetchCachedCustomDomain() || {};

  return createBrowserRouter(
    createRoutesFromElements([
      ...GeneralRoutes(),
      ...(isCustomDomain
        ? CustomDomainRoutes(flags)
        : CommonDomainRoutes(flags)),
      <Route key="routes" path="*" element={withLayout(PageNotFound, {})} />,
    ]),
  );
};
export default Router;
