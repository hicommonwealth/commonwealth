import { trpc } from '@hicommonwealth/adapters';
import { GlobalActivityCache, Reaction, Thread } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { applyCanvasSignedDataMiddleware } from '../federation';

export const trpcRouter = trpc.router({
  createThread: trpc.command(
    Thread.CreateThread,
    trpc.Tag.Thread,
    [
      MixpanelCommunityInteractionEvent.CREATE_THREAD,
      ({ community_id }) => ({ community: community_id }),
    ],
    applyCanvasSignedDataMiddleware,
  ),
  updateThread: trpc.command(
    Thread.UpdateThread,
    trpc.Tag.Thread,
    (input) =>
      Promise.resolve(
        input.stage !== undefined
          ? [MixpanelCommunityInteractionEvent.UPDATE_STAGE, {}]
          : undefined,
      ),
    applyCanvasSignedDataMiddleware,
  ),
  createThreadReaction: trpc.command(
    Thread.CreateThreadReaction,
    trpc.Tag.Reaction,
    [
      MixpanelCommunityInteractionEvent.CREATE_REACTION,
      ({ community_id }) => ({ community: community_id }),
    ],
    applyCanvasSignedDataMiddleware,
  ),
  deleteThread: trpc.command(
    Thread.DeleteThread,
    trpc.Tag.Thread,
    async (_, output) => {
      // Using track output middleware to invalidate gac
      // TODO: Generalize output middleware to cover (analytics, gac invalidation, canvas, etc)
      const gac = GlobalActivityCache.getInstance();
      gac && (await gac.deleteActivityFromCache(output.thread_id));
      return undefined;
    },
    applyCanvasSignedDataMiddleware,
  ),
  deleteReaction: trpc.command(
    Reaction.DeleteReaction,
    trpc.Tag.Reaction,
    undefined,
    applyCanvasSignedDataMiddleware,
  ),
});
