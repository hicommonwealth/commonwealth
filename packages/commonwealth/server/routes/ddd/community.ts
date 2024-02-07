import { expressCommand, expressQuery } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';
import { Router } from 'express';
import passport from 'passport';

const router = Router();

//router.put('/:id', expressCommand(Community.CreateCommunity));

//router.post(
//  '/set-community-namespace/:id',
//  expressCommand(Community.SetCommunityNamespace),
//);

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

export default router;
