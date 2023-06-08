import { TypedRequestParams, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CommentAttributes } from '../../models/comment';

type DeleteCommentResponse = CommentAttributes;

export const deleteCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteCommentRequestParams>,
  res: TypedResponse<DeleteCommentResponse>
) => {
  const { user, address, chain } = req;
  const { id: commentId } = req.params;

  await controllers.comments.deleteComment(user, address, chain, commentId);

  return success(res, null);
};
