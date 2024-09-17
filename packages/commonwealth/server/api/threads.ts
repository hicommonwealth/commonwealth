import { trpc } from '@hicommonwealth/adapters';
import { GlobalActivityCache, Thread, models } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';

export const trpcRouter = trpc.router({
  createThread: trpc.command(Thread.CreateThread, trpc.Tag.Thread, [
    MixpanelCommunityInteractionEvent.CREATE_THREAD,
    ({ community_id }) => ({ community: community_id }),
  ]),
  updateThread: trpc.command(Thread.UpdateThread, trpc.Tag.Thread, (input) =>
    Promise.resolve(
      input.stage !== undefined
        ? [MixpanelCommunityInteractionEvent.UPDATE_STAGE, {}]
        : undefined,
    ),
  ),
  createThreadReaction: trpc.command(
    Thread.CreateThreadReaction,
    trpc.Tag.Thread,
    [
      MixpanelCommunityInteractionEvent.CREATE_REACTION,
      ({ community_id }) => ({ community: community_id }),
    ],
  ),
  deleteThread: trpc.command(
    Thread.DeleteThread,
    trpc.Tag.Thread,
    (_, output) => {
      // Using track output middleware to invalidate gac
      // TODO: Generalize output middleware to cover (analytics, gac invalidation, canvas, etc)
      const gac = GlobalActivityCache.getInstance(models);
      gac && gac.deleteActivityFromCache(output.thread_id);
      return Promise.resolve(undefined);
    },
  ),
});
