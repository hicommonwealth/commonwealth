import { statsMiddleware } from '@hicommonwealth/adapters';
import { Router } from 'express';
import community from './community';

const router = Router();

// sub-routes
router.use('/community', statsMiddleware, community);

export default router;
