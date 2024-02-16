import {
  analyticsMiddleware,
  expressCommand,
  expressQuery,
} from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';
import { Router } from 'express';
import passport from 'passport';
import { MixpanelCommunityInteractionEvent } from 'shared/analytics/types';

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
  analyticsMiddleware(MixpanelCommunityInteractionEvent.CREATE_GROUP),
  expressCommand(Community.CreateGroup),
);

router.post(
  '/demo',
  analyticsMiddleware<Community.Demo>('Demo Event', (results) => {
    return {
      x: results.numItems,
    };
  }),
  expressCommand(Community.Demo),
);

export default router;
