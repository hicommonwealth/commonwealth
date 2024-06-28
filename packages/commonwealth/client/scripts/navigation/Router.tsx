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
  contestEnabled: boolean;
  knockInAppNotifications: boolean;
  knockPushNotifications: boolean;
};

const Router = (customDomain: string) => {
  const client = OpenFeature.getClient();
  const proposalTemplatesEnabled = client.getBooleanValue(
    'proposalTemplates',
    false,
  );
  const contestEnabled = client.getBooleanValue('contest', false);

  const knockInAppNotifications = client.getBooleanValue(
    'knockInAppNotifications',
    false,
  );

  const knockPushNotifications = client.getBooleanValue(
    'knockPushNotifications',
    false,
  );

  const flags = {
    proposalTemplatesEnabled,
    contestEnabled,
    knockInAppNotifications,
    knockPushNotifications,
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
