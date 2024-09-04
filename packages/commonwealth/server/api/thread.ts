import { trpc } from '@hicommonwealth/adapters';
import { Thread } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';

export const trpcRouter = trpc.router({
  createThread: trpc.command(Thread.CreateThread, trpc.Tag.Thread, [
    MixpanelCommunityInteractionEvent.CREATE_THREAD,
    ({ community_id }) => ({ community: community_id }),
  ]),
  getBulkThreads: trpc.query(Thread.GetBulkThreads, trpc.Tag.Thread),
  getThreads: trpc.query(Thread.GetThreads, trpc.Tag.Thread),
});
