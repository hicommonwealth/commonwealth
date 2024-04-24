import { trpc } from '@hicommonwealth/adapters';
import { Subscription } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createCommentSubscription: trpc.command(
    Subscription.CreateCommentSubscription,
    trpc.Tag.Subscription,
  ),
  createCommunityAlert: trpc.command(
    Subscription.CreateCommunityAlert,
    trpc.Tag.Subscription,
  ),
  createThreadSubscription: trpc.command(
    Subscription.CreateThreadSubscription,
    trpc.Tag.Subscription,
  ),
  deleteCommentSubscription: trpc.command(
    Subscription.DeleteCommentSubscription,
    trpc.Tag.Subscription,
  ),
  deleteCommunityAlert: trpc.command(
    Subscription.DeleteCommunityAlerts,
    trpc.Tag.Subscription,
  ),
  deleteThreadSubscription: trpc.command(
    Subscription.DeleteThreadSubscription,
    trpc.Tag.Subscription,
  ),
  getCommentSubscriptions: trpc.query(Subscription.GetCommentSubscriptions),
  getCommunityAlerts: trpc.query(Subscription.GetCommunityAlerts),
  getSubscriptionPreferences: trpc.query(
    Subscription.GetSubscriptionPreferences,
  ),
  getThreadSubscriptions: trpc.query(Subscription.GetThreadSubscriptions),
  updateSubscriptionPreferences: trpc.command(
    Subscription.UpdateSubscriptionPreferences,
    trpc.Tag.Subscription,
  ),
});
