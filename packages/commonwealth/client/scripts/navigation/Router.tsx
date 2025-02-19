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
import { isMobileApp } from '../hooks/useReactNativeWebView';
import CommonDomainRoutes from './CommonDomainRoutes';
import GeneralRoutes from './GeneralRoutes';

export type RouteFeatureFlags = {
  homePageEnable: boolean;
  launchpadEnabled: boolean;
  xpEnabled: boolean;
  communityHomeEnabled: boolean;
  mobileApp: boolean;
  governancePageEnabled: boolean;
};

const Router = () => {
  const client = OpenFeature.getClient();

  const homePageEnable = client.getBooleanValue('homePage', false);
  const launchpadEnabled = client.getBooleanValue('launchpad', false);
  const xpEnabled = client.getBooleanValue('xp', false);
  const communityHomeEnabled = client.getBooleanValue('communityHome', false);
  const governancePageEnabled = client.getBooleanValue('governancePage', false);
  const mobileApp = isMobileApp();
  const flags = {
    homePageEnable,
    launchpadEnabled,
    xpEnabled,
    communityHomeEnabled,
    mobileApp,
    governancePageEnabled,
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
