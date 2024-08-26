import { trpc } from '@hicommonwealth/adapters';
import { Thread } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createThread: trpc.command(Thread.CreateThread, trpc.Tag.Thread),
  getBulkThreads: trpc.query(Thread.GetBulkThreads, trpc.Tag.Thread),
});

// TODO: analytics middleware
//   const analyticsOptions = {
//     event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
//     community: community.id,
//     userId: user.id,
//   };
//   controllers.analytics.track(analyticsOptions, req).catch(console.error);
