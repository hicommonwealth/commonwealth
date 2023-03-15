import {
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';

import generalRoutes from './generalRoutes';
import commonDomainRoutes from './commonDomainRoutes';

const router = createBrowserRouter(
  createRoutesFromElements([...generalRoutes(), ...commonDomainRoutes()])
);

export default router;
