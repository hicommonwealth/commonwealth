import { trpc } from '@hicommonwealth/adapters';
import { Thread } from '@hicommonwealth/model';
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
    trpc.Tag.Thread,
    [
      MixpanelCommunityInteractionEvent.CREATE_REACTION,
      ({ community_id }) => ({ community: community_id }),
    ],
    applyCanvasSignedDataMiddleware,
  ),
});
