import { useFlag } from 'hooks/useFlag';
import CustomDomainRoutes from 'navigation/CustomDomainRoutes';
import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { fetchCachedCustomDomain } from 'state/api/configuration';
import { withLayout } from 'views/Layout';
import { PageNotFound } from 'views/pages/404';
import CommonDomainRoutes from './CommonDomainRoutes';
import GeneralRoutes from './GeneralRoutes';

export type RouteFeatureFlags = {};

const Router = () => {
  const { isCustomDomain } = fetchCachedCustomDomain() || {};
  const marketsEnabled = useFlag('markets');

  const router = createBrowserRouter(
    createRoutesFromElements([
      ...GeneralRoutes(),
      ...(isCustomDomain
        ? CustomDomainRoutes(marketsEnabled)
        : CommonDomainRoutes(marketsEnabled)),
      <Route key="routes" path="*" element={withLayout(PageNotFound, {})} />,
    ]),
  );

  return <RouterProvider router={router} />;
};
export default Router;
