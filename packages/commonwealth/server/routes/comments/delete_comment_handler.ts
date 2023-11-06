import { TypedRequestParams, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CommentAttributes } from '../../models/comment';

type DeleteCommentRequestParams = {
  id: string;
};
type DeleteCommentResponse = CommentAttributes;

export const deleteCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteCommentRequestParams>,
  res: TypedResponse<DeleteCommentResponse>
) => {
  const { user, address, chain: community } = req;
  const { id: commentId } = req.params;

  await controllers.comments.deleteComment({
    user,
    address,
    community,
    commentId: parseInt(commentId, 10),
  });

  return success(res, undefined);
};
