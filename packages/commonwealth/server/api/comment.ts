import { trpc } from '@hicommonwealth/adapters';
import { Comment } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { applyCanvasSignedData } from '../federation';

export const trpcRouter = trpc.router({
  createComment: trpc.command(Comment.CreateComment, trpc.Tag.Comment, [
    trpc.fireAndForget(async (input, _, ctx) => {
      await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    }),
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.CREATE_COMMENT,
      (output) => ({ community: output.community_id }),
    ]),
  ]),
  updateComment: trpc.command(Comment.UpdateComment, trpc.Tag.Comment, [
    trpc.fireAndForget(async (input, _, ctx) => {
      await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
    }),
  ]),
  createCommentReaction: trpc.command(
    Comment.CreateCommentReaction,
    trpc.Tag.Reaction,
    [
      trpc.fireAndForget(async (input, _, ctx) => {
        await applyCanvasSignedData(ctx.req.path, input.canvas_signed_data);
      }),
      trpc.trackAnalytics([
        MixpanelCommunityInteractionEvent.CREATE_REACTION,
        (output) => ({ community: output.community_id }),
      ]),
    ],
  ),
  searchComments: trpc.query(Comment.SearchComments, trpc.Tag.Comment),
  getComments: trpc.query(Comment.GetComments, trpc.Tag.Comment),
  deleteComment: trpc.command(Comment.DeleteComment, trpc.Tag.Comment),
  setCommentSpam: trpc.command(Comment.SetCommentSpam, trpc.Tag.Comment),
  viewComments: trpc.query(Comment.ViewComments, trpc.Tag.Comment),
});
