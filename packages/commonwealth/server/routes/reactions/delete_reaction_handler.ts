import { AppError } from '@hicommonwealth/adapters';
import { ServerControllers } from 'server/routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

const Errors = {
  InvalidReactionId: 'Invalid reaction ID',
};

type DeleteReactionRequest = { id: string };
type DeleteReactionResponse = undefined;

export const deleteReactionHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteReactionRequest>,
  res: TypedResponse<DeleteReactionResponse>,
) => {
  const reactionId = parseInt(req.params.id, 10);
  if (!reactionId) {
    throw new AppError(Errors.InvalidReactionId);
  }

  await controllers.reactions.deleteReaction({
    user: req.user,
    address: req.address,
    community: req.community,
    reactionId,
  });

  return success(res, undefined);
};
