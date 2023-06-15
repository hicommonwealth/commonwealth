import {
  TypedRequest,
  TypedRequestBody,
  TypedResponse,
  success,
} from '../../types';
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
  const { body: commentBody } = req.body;
  if (!commentId) {
    throw new AppError(Errors.NoId);
  }
  if (!commentBody) {
    throw new AppError(Errors.NoBody);
  }
  const attachments = req.body['attachments[]'];

  const [updatedComment, notificationOptions] =
    await controllers.comments.updateComment(
      user,
      address,
      chain,
      commentId,
      commentBody,
      attachments
    );

  // emit notifications
  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  return success(res, updatedComment);
};
