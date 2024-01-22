import { expressCommand } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';
import { Router } from 'express';
import passport from 'passport';

const router = Router();

//router.put('/:id', expressCommand(Community.CreateCommunity));

//router.post(
//  '/set-community-namespace/:id',
//  expressCommand(Community.SetCommunityNamespace),
//);

router.put(
  '/:id/stake',
  passport.authenticate('jwt', { session: false }),
  expressCommand(Community.SetCommunityStake),
);

export default router;
