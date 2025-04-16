import { trpc } from '@hicommonwealth/adapters';
import { Comment, middleware } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';

export const trpcRouter = trpc.router({
  createComment: trpc.command(Comment.CreateComment, trpc.Tag.Comment, [
    // trpc.fireAndForget(async (input, _, ctx) => {
    //   await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    // }),
    trpc.fireAndForget(async (_, __, ctx) => {
      await middleware.incrementUserCount(ctx.actor.user.id!, 'creates');
    }),
    trpc.fireAndForget(async (_, output) => {
      await middleware.updateThreadRankOnComment(output);
    }),
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
    trpc.fireAndForget(async (_, output) => {
      await middleware.updateThreadRankOnCommentIneligibility(output);
    }),
  ]),
  toggleCommentSpam: trpc.command(Comment.ToggleCommentSpam, trpc.Tag.Comment, [
    trpc.fireAndForget(async (_, output) => {
      await middleware.updateThreadRankOnCommentIneligibility(output);
    }),
  ]),
});
