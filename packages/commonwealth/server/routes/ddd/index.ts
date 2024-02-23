import { errorMiddleware, statsMiddleware } from '@hicommonwealth/adapters';
import { Router } from 'express';
import comment from './comment';
import community from './community';

const router = Router();

// sub-routes
router.use('/community', statsMiddleware, community);
router.use('/comment', statsMiddleware, comment);
router.use(errorMiddleware);

export default router;
