import { trpc } from '@hicommonwealth/adapters';
import { Comment } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { signCanvas } from '../federation';

export const trpcRouter = trpc.router({
  createComment: trpc.command(Comment.CreateComment, trpc.Tag.Comment, [
    signCanvas(),
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.CREATE_COMMENT,
      (output) => ({ community: output.community_id }),
    ]),
  ]),
  updateComment: trpc.command(Comment.UpdateComment, trpc.Tag.Comment, [
    signCanvas(),
  ]),
  createCommentReaction: trpc.command(
    Comment.CreateCommentReaction,
    trpc.Tag.Reaction,
    [
      signCanvas(),
      trpc.trackAnalytics([
        MixpanelCommunityInteractionEvent.CREATE_REACTION,
        (output) => ({ community: output.community_id }),
      ]),
    ],
  ),
  searchComments: trpc.query(Comment.SearchComments, trpc.Tag.Comment),
  getComments: trpc.query(Comment.GetComments, trpc.Tag.Comment),
  deleteComment: trpc.command(Comment.DeleteComment, trpc.Tag.Comment),
});
