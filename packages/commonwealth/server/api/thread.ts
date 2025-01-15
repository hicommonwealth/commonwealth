import { trpc } from '@hicommonwealth/adapters';
import { CacheNamespaces, cache, logger } from '@hicommonwealth/core';
import { Reaction, Thread, models } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { applyCanvasSignedData } from '../federation';

const log = logger(import.meta);

export const trpcRouter = trpc.router({
  createThread: trpc.command(Thread.CreateThread, trpc.Tag.Thread, [
    trpc.fireAndForget(async (input, _, ctx) => {
      await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    }),
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.CREATE_THREAD,
      ({ community_id }) => ({ community: community_id }),
    ]),
  ]),
  updateThread: trpc.command(Thread.UpdateThread, trpc.Tag.Thread, [
    trpc.fireAndForget(async (input, _, ctx) => {
      await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    }),
    trpc.trackAnalytics((input) =>
      Promise.resolve(
        input.stage !== undefined
          ? [MixpanelCommunityInteractionEvent.UPDATE_STAGE, {}]
          : undefined,
      ),
    ),
  ]),
  createThreadReaction: trpc.command(
    Thread.CreateThreadReaction,
    trpc.Tag.Reaction,
    [
      trpc.fireAndForget(async (input, _, ctx) => {
        await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
      }),
      trpc.trackAnalytics([
        MixpanelCommunityInteractionEvent.CREATE_REACTION,
        ({ community_id }) => ({ community: community_id }),
      ]),
    ],
  ),
  deleteThread: trpc.command(Thread.DeleteThread, trpc.Tag.Thread, [
    trpc.fireAndForget(async (input, _, ctx) => {
      await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    }),
    trpc.fireAndForget(async () => {
      await cache().deleteKey(
        CacheNamespaces.Query_Response,
        'GetGlobalActivity_{}', // this is the global activity cache key
      );
    }),
  ]),
  deleteReaction: trpc.command(Reaction.DeleteReaction, trpc.Tag.Reaction, [
    trpc.fireAndForget(async (input, _, ctx) => {
      await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    }),
  ]),
  getThreads: trpc.query(Thread.GetThreads, trpc.Tag.Thread),
  getThreadsByIds: trpc.query(
    Thread.GetThreadsByIds,
    trpc.Tag.Thread,
    undefined,
    [
      trpc.fireAndForget(async (input) => {
        log.trace('incrementing thread view count', { ids: input.thread_ids });
        const ids = input.thread_ids.split(',').map((x) => parseInt(x, 10));
        await models.Thread.increment(
          { view_count: 1 },
          { where: { id: ids } },
        );
      }),
    ],
  ),
});
