import { trpc } from '@hicommonwealth/adapters';
import { Thread } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createThread: trpc.command(Thread.CreateThread, trpc.Tag.Thread),
  getBulkThreads: trpc.query(Thread.GetBulkThreads, trpc.Tag.Thread),
});

// TODO: post notifications middleware -> check with Tim
//   const allNotificationOptions: EmitOptions[] = [];
//   allNotificationOptions.push({
//     notification: {
//       categoryId: NotificationCategories.NewThread,
//       data: {
//         created_at: new Date(),
//         thread_id: finalThread.id,
//         root_type: ProposalType.Thread,
//         root_title: finalThread.title,
//         comment_text: finalThread.body,
//         community_id: finalThread.community_id,
//         author_address: finalThread.Address.address,
//         author_community_id: finalThread.Address.community_id,
//       },
//     },
//     excludeAddresses: [finalThread.Address.address],
//   });
//   for (const n of notificationOptions) {
//     controllers.notifications.emit(n).catch(console.error);
//   }

// TODO: analytics middleware
//   const analyticsOptions = {
//     event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
//     community: community.id,
//     userId: user.id,
//   };
//   controllers.analytics.track(analyticsOptions, req).catch(console.error);
