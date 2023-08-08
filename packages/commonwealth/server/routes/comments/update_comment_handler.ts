import { TypedRequest, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CommentAttributes } from 'server/models/comment';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  NoId: 'Must provide id',
  NoBody: 'Must provide text body',
  NotAddrOwner: 'Address not owned by this user',
  NoProposal: 'No matching proposal found',
};

type UpdateCommentRequestBody = {
  body: string;
  discord_meta?: any;
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
  const { id } = req.params;
  const { body: commentBody, discord_meta } = req.body;

  let commentId = id;

  // Special handling for discobot threads
  if (discord_meta !== undefined && discord_meta !== null) {
    const existingComment = await controllers.threads.models.Comment.findOne({
      where: { discord_meta: discord_meta },
    });
    if (existingComment) {
      commentId = existingComment.id;
    } else {
      throw new AppError(Errors.NoId);
    }
  }

  if (!commentId) {
    throw new AppError(Errors.NoId);
  }
  if (!commentBody) {
    throw new AppError(Errors.NoBody);
  }

  const [updatedComment, notificationOptions] =
    await controllers.comments.updateComment({
      user,
      address,
      chain,
      commentId,
      commentBody,
    });

  // emit notifications
  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  return success(res, updatedComment);
};
