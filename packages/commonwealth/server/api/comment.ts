import { trpc } from '@hicommonwealth/adapters';
import { Comment } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';

export const trpcRouter = trpc.router({
  createComment: trpc.command(Comment.CreateComment, trpc.Tag.Comment, [
    MixpanelCommunityInteractionEvent.CREATE_COMMENT,
    (output) => ({ community: output.community_id }),
  ]),
  searchComments: trpc.query(Comment.SearchComments, trpc.Tag.Comment),
  getComments: trpc.query(Comment.GetComments, trpc.Tag.Comment),
});
