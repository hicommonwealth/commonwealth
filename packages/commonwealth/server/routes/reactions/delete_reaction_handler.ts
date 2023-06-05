import { TypedRequestParams, TypedResponse, success } from '../../types';
import { AppError } from 'common-common/src/errors';
import { ServerControllers } from 'server/routing/router';

const Errors = {
  InvalidReactionId: 'Invalid reaction ID',
};

type DeleteReactionRequest = { id: string };
type DeleteReactionResponse = undefined;

export const deleteReactionHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteReactionRequest>,
  res: TypedResponse<DeleteReactionResponse>
) => {
  const reactionId = parseInt(req.params.id, 10);
  if (!reactionId) {
    throw new AppError(Errors.InvalidReactionId);
  }

  await controllers.reactions.deleteReaction(req.user, reactionId);

  return success(res, undefined);
};
