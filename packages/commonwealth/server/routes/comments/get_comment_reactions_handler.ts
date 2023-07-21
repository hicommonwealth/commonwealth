import { TypedRequest, TypedResponse, success } from '../../types';
import { AppError } from 'common-common/src/errors';
import { ReactionAttributes } from 'server/models/reaction';
import { ServerControllers } from 'server/routing/router';

const Errors = {
  InvalidCommentId: 'Invalid comment ID',
};

type GetCommentReactionsRequestParams = { id: string };
type GetCommentReactionsRequestBody = {
  reaction: string;
  canvas_action?: any;
  canvas_session?: any;
  canvas_hash?: any;
};
type GetCommentReactionsResponse = ReactionAttributes[];

export const getCommentReactionsHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<
    GetCommentReactionsRequestBody,
    any,
    GetCommentReactionsRequestParams
  >,
  res: TypedResponse<GetCommentReactionsResponse>
) => {
  const commentId = parseInt(req.params.id, 10);
  if (!commentId) {
    throw new AppError(Errors.InvalidCommentId);
  }

  const reactions = await controllers.comments.getCommentReactions({
    commentId,
  });

  return success(res, reactions);
};
