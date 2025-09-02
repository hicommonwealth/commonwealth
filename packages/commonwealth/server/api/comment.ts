import { trpc } from '@hicommonwealth/adapters';
import { Comment } from '@hicommonwealth/model';
import * as middleware from '@hicommonwealth/model/middleware';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { config } from '../config';
import {
  decrementThreadRank,
  incrementThreadRank,
  shouldRankThread,
} from './ranking';

export const trpcRouter = trpc.router({
  createAICompletionComment: trpc.command(
    Comment.CreateAICompletionComment,
    trpc.Tag.Comment,
    [
      trpc.trackAnalytics([
        MixpanelCommunityInteractionEvent.CREATE_COMMENT,
        (output) => ({ community: output.community_id, is_ai_generated: true }),
      ]),
    ],
  ),
  createAICompletionToken: trpc.command(
    Comment.CreateAICompletionToken,
    trpc.Tag.Comment,
  ),
  createComment: trpc.command(Comment.CreateComment, trpc.Tag.Comment, [
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
          community_id,
          thread_id,
          user_tier_at_creation,
          marked_as_spam_at,
          body,
        },
      ) => {
        if (
          !shouldRankThread({
            community_id,
            user_tier_at_creation,
            marked_as_spam_at,
            body,
          })
        )
          return;
        await incrementThreadRank(config.HEURISTIC_WEIGHTS.COMMENT_WEIGHT, {
          community_id,
          thread_id,
          user_tier_at_creation: user_tier_at_creation!,
        });
      },
    ),
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.CREATE_COMMENT,
      (output) => ({ community: output.community_id }),
    ]),
  ]),
  updateComment: trpc.command(Comment.UpdateComment, trpc.Tag.Comment, [
    // trpc.fireAndForget(async (input, _, ctx) => {
    //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    // }),
  ]),
  createCommentReaction: trpc.command(
    Comment.CreateCommentReaction,
    trpc.Tag.Reaction,
    [
      // trpc.fireAndForget(async (input, _, ctx) => {
      //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
      // }),
      trpc.fireAndForget(async (_, __, ctx) => {
        await middleware.incrementUserCount(ctx.actor.user.id!, 'upvotes');
      }),
      trpc.trackAnalytics([
        MixpanelCommunityInteractionEvent.CREATE_REACTION,
        (output) => ({ community: output.community_id }),
      ]),
    ],
  ),
  searchComments: trpc.query(Comment.SearchComments, trpc.Tag.Comment),
  getComments: trpc.query(Comment.GetComments, trpc.Tag.Comment),
  deleteComment: trpc.command(Comment.DeleteComment, trpc.Tag.Comment, [
    trpc.fireAndForget(
      async (
        _,
        {
          thread_id,
          community_id,
          user_tier_at_creation,
          marked_as_spam_at,
          body,
        },
      ) => {
        if (!user_tier_at_creation) return;
        if (
          !shouldRankThread({
            community_id,
            user_tier_at_creation,
            marked_as_spam_at,
            body,
          })
        )
          return;
        await decrementThreadRank(config.HEURISTIC_WEIGHTS.COMMENT_WEIGHT, {
          thread_id,
          community_id,
          user_tier_at_creation: user_tier_at_creation,
        });
      },
    ),
  ]),
  toggleCommentSpam: trpc.command(Comment.ToggleCommentSpam, trpc.Tag.Comment, [
    trpc.fireAndForget(
      async (
        { spam },
        {
          thread_id,
          community_id,
          user_tier_at_creation,
          marked_as_spam_at,
          spam_toggled,
          body,
        },
      ) => {
        if (!user_tier_at_creation || !spam_toggled) return;

        if (spam === true && marked_as_spam_at !== null) {
          await decrementThreadRank(config.HEURISTIC_WEIGHTS.COMMENT_WEIGHT, {
            thread_id,
            community_id,
            user_tier_at_creation: user_tier_at_creation,
          });
        } else if (spam === false && marked_as_spam_at === null) {
          if (
            !shouldRankThread({
              community_id,
              user_tier_at_creation,
              marked_as_spam_at,
              body,
            })
          )
            return;
          await incrementThreadRank(config.HEURISTIC_WEIGHTS.COMMENT_WEIGHT, {
            community_id,
            thread_id,
            user_tier_at_creation,
          });
        }
      },
    ),
  ]),
});
