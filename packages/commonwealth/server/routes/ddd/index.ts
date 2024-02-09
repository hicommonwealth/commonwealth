import { errorMiddleware, statsMiddleware } from '@hicommonwealth/adapters';
import { Router } from 'express';
import community from './community';
import node from './node';

const router = Router();

// sub-routes
router.use('/community', statsMiddleware, community);
router.use('/node', statsMiddleware, node);
router.use(errorMiddleware);

export default router;
