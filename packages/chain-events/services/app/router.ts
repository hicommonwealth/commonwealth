import { Request, Response, Router } from "express";
import passport from 'passport';
import entities from "./routes/entities";
import events from './routes/events';
import { DB } from "../database/database";

/**
 * Function that creates an Express Router for the ChainEvents app. This function defines all of our apps routes.
 * @param models {DB}
 */
function setupRouter(models: DB): Router {
  const router = Router();


  router.get('/entities', entities.bind(this, models));
  router.get('/events', events.bind(this, models));

  router.get('/test', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
    return res.status(200).json({success: true})
  });

  return router;
}

export default setupRouter;
