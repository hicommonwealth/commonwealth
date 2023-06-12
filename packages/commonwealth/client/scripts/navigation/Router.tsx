import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import React from 'react';

import GeneralRoutes from './GeneralRoutes';
import CommonDomainRoutes from './CommonDomainRoutes';
import CustomDomainRoutes from 'navigation/CustomDomainRoutes';
import { PageNotFound } from 'views/pages/404';
import { withLayout } from 'views/Layout';

const Router = (customDomain: string, isAppLoading: boolean) =>
  createBrowserRouter(
    createRoutesFromElements([
      ...GeneralRoutes(isAppLoading),
      ...(customDomain
        ? CustomDomainRoutes(isAppLoading)
        : CommonDomainRoutes(isAppLoading)),
      <Route path="*" element={withLayout(PageNotFound, { isAppLoading })} />,
    ])
  );
export default Router;
