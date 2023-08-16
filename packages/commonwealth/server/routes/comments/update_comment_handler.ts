import { TypedRequest, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CommentAttributes } from 'server/models/comment';

type UpdateCommentRequestBody = {
  body: string;
  bot_meta?: any;
};
type UpdateCommentRequestParams = {
  id: number;
  body: string;
};
type UpdateCommentResponse = CommentAttributes;

export const updateCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<UpdateCommentRequestBody, {}, UpdateCommentRequestParams>,
  res: TypedResponse<UpdateCommentResponse>
) => {
  const { user, chain, address } = req;
  const { id: commentId } = req.params;
  const { body: commentBody, bot_meta: botMeta } = req.body;

  const [updatedComment, notificationOptions] =
    await controllers.comments.updateComment({
      user,
      address,
      chain,
      commentId,
      commentBody,
      botMeta,
    });

  // emit notifications
  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  return success(res, updatedComment);
};
