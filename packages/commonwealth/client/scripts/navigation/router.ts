import customDomainRoutes from 'navigation/customDomainRoutes';
import { createBrowserRouter, createRoutesFromElements, } from 'react-router-dom';
import commonDomainRoutes from './commonDomainRoutes';

import generalRoutes from './generalRoutes';

const router = (customDomain: string) =>
  createBrowserRouter(
    createRoutesFromElements([
      ...generalRoutes(),
      ...(customDomain ? customDomainRoutes() : commonDomainRoutes()),
    ])
  );
export default router;
