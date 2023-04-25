import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import React from 'react';

import generalRoutes from './generalRoutes';
import commonDomainRoutes from './commonDomainRoutes';
import customDomainRoutes from 'navigation/customDomainRoutes';
import { PageNotFound } from 'views/pages/404';
import { withLayout } from 'views/layout';

const router = (customDomain: string) =>
  createBrowserRouter(
    createRoutesFromElements([
      ...generalRoutes(),
      ...(customDomain ? customDomainRoutes() : commonDomainRoutes()),
      <Route path="*" element={withLayout(PageNotFound, {})} />,
    ])
  );
export default router;
