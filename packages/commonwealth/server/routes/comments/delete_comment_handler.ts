import { CommentAttributes } from '@hicommonwealth/model';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

type DeleteCommentRequestParams = {
  id: string;
};
type DeleteCommentResponse = CommentAttributes;

export const deleteCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteCommentRequestParams>,
  res: TypedResponse<DeleteCommentResponse>,
) => {
  const { user, address, community } = req;
  const { id: commentId } = req.params;

  await controllers.comments.deleteComment({
    user,
    address,
    community,
    commentId: parseInt(commentId, 10),
  });

  return success(res, undefined);
};
