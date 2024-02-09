import { expressCommand } from '@hicommonwealth/adapters';
import { Node } from '@hicommonwealth/model';
import { Router } from 'express';
import passport from 'passport';

const router = Router();

// id is the node url
router.post(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  expressCommand(Node.CreateNode),
);

export default router;
