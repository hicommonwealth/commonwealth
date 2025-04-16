import { trpc } from '@hicommonwealth/adapters';
import { cache, CacheNamespaces, logger } from '@hicommonwealth/core';
import { middleware, models, Reaction, Thread } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { config } from '../config';
import { updateRankOnThreadIneligibility } from './ranking';

const log = logger(import.meta);

export const trpcRouter = trpc.router({
  createThread: trpc.command(Thread.CreateThread, trpc.Tag.Thread, [
    // trpc.fireAndForget(async (input, _, ctx) => {
    //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    // }),
    trpc.fireAndForget(async (_, __, ctx) => {
      await middleware.incrementUserCount(ctx.actor.user.id!, 'creates');
    }),
    trpc.fireAndForget(async (_, output) => {
      await middleware.createThreadRank(output);
    }),
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.CREATE_THREAD,
      ({ community_id }) => ({ community: community_id }),
    ]),
  ]),
  updateThread: trpc.command(Thread.UpdateThread, trpc.Tag.Thread, [
    // trpc.fireAndForget(async (input, _, ctx) => {
    //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    // }),
    trpc.trackAnalytics((input) =>
      Promise.resolve(
        input.stage !== undefined
          ? [MixpanelCommunityInteractionEvent.UPDATE_STAGE, {}]
          : undefined,
      ),
    ),
    trpc.fireAndForget(
      async ({ spam }, { id, community_id, marked_as_spam_at }) => {
        if (spam === true && marked_as_spam_at !== null) {
          await updateRankOnThreadIneligibility({
            thread_id: id!,
            community_id,
          });
        }
      },
    ),
  ]),
  createThreadReaction: trpc.command(
    Thread.CreateThreadReaction,
    trpc.Tag.Reaction,
    [
      // trpc.fireAndForget(async (input, _, ctx) => {
      //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
      // }),
      trpc.fireAndForget(async (_, __, ctx) => {
        await middleware.incrementUserCount(ctx.actor.user.id!, 'upvotes');
      }),
      trpc.fireAndForget(
        async (_, { community_id, thread_id, user_tier_at_creation }) => {
          await middleware.incrementThreadRank(
            config.HEURISTIC_WEIGHTS.LIKE_WEIGHT,
            {
              community_id,
              thread_id,
              user_tier_at_creation: user_tier_at_creation || 1,
            },
          );
        },
      ),
      trpc.trackAnalytics([
        MixpanelCommunityInteractionEvent.CREATE_REACTION,
        ({ community_id }) => ({ community: community_id }),
      ]),
    ],
  ),
  deleteThread: trpc.command(Thread.DeleteThread, trpc.Tag.Thread, [
    // trpc.fireAndForget(async (input, _, ctx) => {
    //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    // }),
    trpc.fireAndForget(async () => {
      await cache().deleteKey(
        CacheNamespaces.Query_Response,
        'GetGlobalActivity_{}', // this is the global activity cache key
      );
    }),
    trpc.fireAndForget(async (_, output) => {
      await middleware.updateRankOnThreadIneligibility(output);
    }),
  ]),
  deleteReaction: trpc.command(Reaction.DeleteReaction, trpc.Tag.Reaction, [
    // trpc.fireAndForget(async (input, _, ctx) => {
    //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    // }),
    trpc.fireAndForget(async (_, { thread_id, user_tier_at_creation }) => {
      if (thread_id) {
        const thread = await models.Thread.findOne({
          attributes: ['community_id'],
          where: { id: thread_id },
        });
        if (thread) {
          await middleware.decrementThreadRank(
            config.HEURISTIC_WEIGHTS.LIKE_WEIGHT,
            {
              thread_id,
              community_id: thread.community_id,
              user_tier_at_creation: user_tier_at_creation || 1,
            },
          );
        }
      }
    }),
  ]),
  getThreads: trpc.query(Thread.GetThreads, trpc.Tag.Thread),
  getThreadsByIds: trpc.query(
    Thread.GetThreadsByIds,
    trpc.Tag.Thread,
    { ttlSecs: 10 },
    [
      trpc.fireAndForget(async (input) => {
        log.trace('incrementing thread view count', { ids: input.thread_ids });
        const ids = input.thread_ids.split(',').map((x) => parseInt(x, 10));
        await Promise.all(
          ids.map((t) =>
            cache().incrementKey(
              CacheNamespaces.Thread_View_Count,
              t.toString(),
            ),
          ),
        );
      }),
    ],
  ),
});
