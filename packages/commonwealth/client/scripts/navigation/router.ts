import {
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';

import generalRoutes from './generalRoutes';
import commonDomainRoutes from './commonDomainRoutes';
import customDomainRoutes from 'navigation/customDomainRoutes';

const router = (customDomain: string) =>
  createBrowserRouter(
    createRoutesFromElements([
      ...generalRoutes(),
      ...(customDomain ? customDomainRoutes() : commonDomainRoutes()),
    ])
  );
export default router;
