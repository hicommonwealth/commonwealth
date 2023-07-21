import { uniqBy } from 'lodash';
import { ReactionAttributes } from 'server/models/reaction';
import { ServerCommentsController } from '../server_comments_controller';

export type GetCommentReactionsOptions = {
  commentId: number;
};
export type GetCommentReactionsResult = ReactionAttributes[];

export async function __getCommentReactions(
  this: ServerCommentsController,
  { commentId }: GetCommentReactionsOptions
): Promise<GetCommentReactionsResult> {
  const reactions = await this.models.Reaction.findAll({
    where: {
      comment_id: commentId,
    },
    include: [this.models.Address],
    order: [['created_at', 'DESC']],
  });
  return uniqBy(
    reactions.map((c) => c.toJSON()),
    'id'
  );
}
