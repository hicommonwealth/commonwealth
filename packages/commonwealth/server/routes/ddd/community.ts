import { expressCommand, expressQuery } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';
import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get(
  '/:community_id/stake/:stake_id?',
  passport.authenticate('jwt', { session: false }),
  expressQuery(Community.GetCommunityStake),
);

router.put(
  '/:id/stake',
  passport.authenticate('jwt', { session: false }),
  expressCommand(Community.SetCommunityStake),
);

router.post(
  '/:id/group',
  passport.authenticate('jwt', { session: false }),
  expressCommand(Community.CreateGroup),
);

export default router;
