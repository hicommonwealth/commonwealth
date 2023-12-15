import { Router } from 'express';
import useragent from 'express-useragent';
import community from './community-router';
import { errorMiddleware, statsMiddleware } from './middleware';

// main app router
const router = Router();
router.use(useragent.express());

// sub-routes
router.use('/community', statsMiddleware, community);

// catch-all and format errors
router.use(errorMiddleware);
