import { TypedRequestParams, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CommentAttributes } from '../../models/comment';

type DeleteBotCommentRequestParams = {
  message_id: string;
};

type DeleteCommentResponse = CommentAttributes;

export const deleteBotCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteBotCommentRequestParams>,
  res: TypedResponse<DeleteCommentResponse>
) => {
  const { user, address, chain } = req;
  const { message_id } = req.params;

  await controllers.comments.deleteComment({
    user,
    address,
    chain,
    message_id, // Discord bot only
  });

  return success(res, undefined);
};
