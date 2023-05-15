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

const Router = (customDomain: string) =>
  createBrowserRouter(
    createRoutesFromElements([
      ...GeneralRoutes(),
      ...(customDomain ? CustomDomainRoutes() : CommonDomainRoutes()),
      <Route path="*" element={withLayout(PageNotFound, {})} />,
    ])
  );
export default Router;
