import { express, trpc } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';
import { Router } from 'express';
import passport from 'passport';
import { MixpanelCommunityInteractionEvent } from 'shared/analytics/types';

export const expressRouter = Router();
expressRouter.get(
  '/:community_id/stake/:stake_id?',
  passport.authenticate('jwt', { session: false }),
  express.query(Community.GetCommunityStake()),
);
expressRouter.put(
  '/:id/stake',
  passport.authenticate('jwt', { session: false }),
  express.command(Community.SetCommunityStake()),
);
expressRouter.post(
  '/:id/group',
  passport.authenticate('jwt', { session: false }),
  express.analyticsMiddleware(MixpanelCommunityInteractionEvent.CREATE_GROUP),
  express.command(Community.CreateGroup()),
);

// TRPC
export const trpcRouter = trpc.router({
  getStake: trpc.query(Community.GetCommunityStake, true),
  setStake: trpc.command('Community', Community.SetCommunityStake, true),
  createGroup: trpc.command('Community', Community.CreateGroup, true),
  // TODO: trpc analyticsMiddleware(MixpanelCommunityInteractionEvent.CREATE_GROUP),
});
