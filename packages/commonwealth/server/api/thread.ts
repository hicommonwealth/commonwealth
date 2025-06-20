import { trpc } from '@hicommonwealth/adapters';
import { cache, CacheNamespaces, logger } from '@hicommonwealth/core';
import { middleware, models, Reaction, Thread } from '@hicommonwealth/model';
import { CountAggregatorKeys, LinkSource } from '@hicommonwealth/shared';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { config } from '../config';
import {
  createThreadRank,
  decrementThreadRank,
  incrementThreadRank,
  shouldRankThread,
  updateRankOnThreadIneligibility,
} from './ranking';

const log = logger(import.meta);

export const trpcRouter = trpc.router({
  createThread: trpc.command(Thread.CreateThread, trpc.Tag.Thread, [
    // trpc.fireAndForget(async (input, _, ctx) => {
    //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    // }),
    trpc.fireAndForget(async (_, __, ctx) => {
      await middleware.incrementUserCount(ctx.actor.user.id!, 'creates');
    }),
    trpc.fireAndForget(
      async (
        _,
        {
          id,
          created_at,
          user_tier_at_creation,
          community_id,
          community_tier,
          marked_as_spam_at,
          body,
        },
      ) => {
        if (
          !shouldRankThread({
            community_id,
            body,
            user_tier_at_creation,
            community_tier,
            marked_as_spam_at,
          })
        )
          return;
        await createThreadRank(
          {
            id: id!,
            created_at: created_at!,
            user_tier_at_creation: user_tier_at_creation!,
          },
          { id: community_id, tier: community_tier },
        );
      },
    ),
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
      async (
        { spam },
        {
          id,
          community_id,
          marked_as_spam_at,
          created_at,
          user_tier_at_creation,
          spam_toggled,
          body,
        },
      ) => {
        if (!user_tier_at_creation || !spam_toggled) return;

        if (spam === true && marked_as_spam_at) {
          await updateRankOnThreadIneligibility({
            thread_id: id!,
            community_id,
          });
        } else if (spam === false && marked_as_spam_at === null) {
          const community = await models.Community.findOne({
            attributes: ['tier'],
            where: {
              id: community_id,
            },
          });
          if (!community) return;
          if (
            !shouldRankThread({
              community_id,
              body,
              user_tier_at_creation,
              community_tier: community.tier,
              marked_as_spam_at,
            })
          )
            return;
          await createThreadRank(
            { id: id!, created_at: created_at!, user_tier_at_creation },
            {
              id: community_id,
              tier: community.tier,
            },
          );
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
          if (
            !shouldRankThread({
              user_tier_at_creation,
              community_id,
            })
          )
            return;
          await incrementThreadRank(config.HEURISTIC_WEIGHTS.LIKE_WEIGHT, {
            community_id,
            thread_id,
            user_tier_at_creation: user_tier_at_creation!,
          });
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
      await updateRankOnThreadIneligibility(output);
    }),
  ]),
  deleteReaction: trpc.command(Reaction.DeleteReaction, trpc.Tag.Reaction, [
    // trpc.fireAndForget(async (input, _, ctx) => {
    //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    // }),
    trpc.fireAndForget(async (_, { thread_id, user_tier_at_creation }) => {
      if (!user_tier_at_creation) return;
      if (thread_id) {
        const thread = await models.Thread.findOne({
          attributes: ['community_id'],
          where: { id: thread_id },
        });
        if (thread) {
          if (
            !shouldRankThread({
              user_tier_at_creation,
              community_id: thread.community_id,
            })
          )
            return;
          await decrementThreadRank(config.HEURISTIC_WEIGHTS.LIKE_WEIGHT, {
            thread_id,
            community_id: thread.community_id,
            user_tier_at_creation: user_tier_at_creation,
          });
        }
      }
    }),
  ]),
  addLinks: trpc.command(Thread.AddLinks, trpc.Tag.Thread, [
    trpc.trackAnalytics((_, { community_id, new_links }) => {
      if (new_links.length > 0) {
        const source = new_links.at(-1)!.source;
        const event =
          source === LinkSource.Snapshot || source === LinkSource.Proposal
            ? MixpanelCommunityInteractionEvent.LINKED_PROPOSAL
            : source === LinkSource.Thread
              ? MixpanelCommunityInteractionEvent.LINKED_THREAD
              : source === LinkSource.Web
                ? MixpanelCommunityInteractionEvent.LINKED_URL
                : source === LinkSource.Template
                  ? MixpanelCommunityInteractionEvent.LINKED_TEMPLATE
                  : undefined;
        if (event)
          return Promise.resolve([
            event,
            { event, community: community_id, proposalType: source },
          ]);
      }
      return Promise.resolve(undefined);
    }),
  ]),
  deleteLinks: trpc.command(Thread.DeleteLinks, trpc.Tag.Thread),
  getLinks: trpc.query(Thread.GetLinks, trpc.Tag.Thread),
  getThreads: trpc.query(Thread.GetThreads, trpc.Tag.Thread),
  getThreadById: trpc.query(
    Thread.GetThreadById,
    trpc.Tag.Thread,
    { ttlSecs: 10 },
    [
      trpc.fireAndForget(async (input) => {
        log.trace('incrementing thread view count', { id: input.thread_id });
        await cache().incrementHashKey(
          CacheNamespaces.CountAggregator,
          CountAggregatorKeys.ThreadViewCount,
          input.thread_id.toString(),
        );
      }),
    ],
  ),
  getThreadsByIds: trpc.query(
    Thread.GetThreadsByIds,
    trpc.Tag.Thread,
    { ttlSecs: 10 },
    [
      trpc.fireAndForget(async (input) => {
        log.trace('incrementing thread view count', { ids: input.thread_ids });
        await Promise.all(
          input.thread_ids
            .split(',')
            .map((threadId) =>
              cache().incrementHashKey(
                CacheNamespaces.CountAggregator,
                CountAggregatorKeys.ThreadViewCount,
                threadId,
              ),
            ),
        );
      }),
    ],
  ),
  searchThreads: trpc.query(Thread.SearchThreads, trpc.Tag.Thread),
  getActiveThreads: trpc.query(Thread.GetActiveThreads, trpc.Tag.Thread, {
    ttlSecs: 60,
  }),
});
