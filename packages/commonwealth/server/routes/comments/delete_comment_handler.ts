import { TypedRequestParams, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CommentAttributes } from '../../models/comment';
import { AppError } from '../../../../common-common/src/errors';
import { Op } from 'sequelize';

const Errors = {
  InvalidComment: 'Invalid comment ID',
};

type DeleteCommentRequestParams = {
  id: string;
};
type DeleteCommentResponse = CommentAttributes;

export const deleteCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteCommentRequestParams>,
  res: TypedResponse<DeleteCommentResponse>
) => {
  const { user, address, chain } = req;
  const { id: commentId } = req.params;

  await controllers.comments.deleteComment({
    user,
    address,
    chain,
    commentId: parseInt(commentId, 10),
  });

  return success(res, undefined);
};

type DeleteBotCommentRequestParams = {
  message_id: string;
};

export const deleteBotCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteBotCommentRequestParams>,
  res: TypedResponse<DeleteCommentResponse>
) => {
  const { user, address, chain } = req;
  const { message_id } = req.params;

  let commentId;

  if (!message_id) {
    throw new AppError(Errors.InvalidComment);
  }

  // Special handling for discobot threads
  const existingComment = await controllers.threads.models.Comment.findOne({
    where: {
      discord_meta: { [Op.contains]: { message_id: message_id } },
    },
  });

  if (existingComment) {
    commentId = existingComment.id;
  } else {
    throw new AppError(Errors.InvalidComment);
  }

  await controllers.comments.deleteComment({
    user,
    address,
    chain,
    commentId: parseInt(commentId, 10),
  });

  return success(res, undefined);
};
