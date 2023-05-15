import type { Request, Response } from 'express';
import { Router } from 'express';
import passport from 'passport';

import type { DB } from '../database/database';

import entities from './routes/entities';
import eventActivity from './routes/eventActivity';
import migrateEvent from './routes/migrateEvent';
import { registerRoute } from 'chain-events/services/app/middleware';

/**
 * Function that creates an Express Router for the ChainEvents app. This function defines all of our apps routes.
 * @param models {DB}
 */
function setupRouter(models: DB): Router {
  const router = Router();

  registerRoute(router, 'get', '/entities', entities.bind(this, models));
  registerRoute(router, 'get', '/events', eventActivity.bind(this, models));
  registerRoute(
    router,
    'post',
    '/migrateEvent',
    migrateEvent.bind(this, models)
  );

  return router;
}

export default setupRouter;
