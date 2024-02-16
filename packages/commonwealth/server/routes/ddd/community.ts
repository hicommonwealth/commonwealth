import {
  analyticsMiddleware,
  expressCommand,
  expressQuery,
} from '@hicommonwealth/adapters';
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
  '/demo',
  analyticsMiddleware<Community.Demo>('Demo Event', (payload) => {
    return {
      x: payload.numItems,
    };
  }),
  expressCommand(Community.Demo),
);

export default router;
