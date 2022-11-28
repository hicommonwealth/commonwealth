import { Request, Response, Router } from 'express';
import passport from 'passport';
import entities from './routes/entities';
import eventActivity from './routes/eventActivity';
import { DB } from '../database/database';
import migrateEvent from "./routes/migrateEvent";

/**
 * Function that creates an Express Router for the ChainEvents app. This function defines all of our apps routes.
 * @param models {DB}
 */
function setupRouter(models: DB): Router {
  const router = Router();

  router.get('/entities', entities.bind(this, models));
  router.get('/events', eventActivity.bind(this, models));

  router.post('/migrateEvent', migrateEvent.bind(this, models));

  router.get(
    '/test',
    passport.authenticate('jwt', { session: false }),
    (req: Request, res: Response) => {
      return res.status(200).json({ success: true });
    }
  );

  return router;
}

export default setupRouter;
