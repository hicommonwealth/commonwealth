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
// TODO: are there better ways to chain middleware?
// TODO: how to configure custom paths (adapters, open api)?
export const trpcRouter = trpc.router({
  getStake: trpc.query(Community.GetCommunityStake(), trpc.authenticate),
  setStake: trpc.command(Community.SetCommunityStake(), trpc.authenticate),
  createGroup: trpc.command(Community.CreateGroup(), trpc.authenticate),
  //TODO: trpc analyticsMiddleware(MixpanelCommunityInteractionEvent.CREATE_GROUP),
});
