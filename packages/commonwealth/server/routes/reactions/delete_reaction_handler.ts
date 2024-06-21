import { AppError } from '@hicommonwealth/core';
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
    // @ts-expect-error StrictNullChecks
    user: req.user,
    // @ts-expect-error StrictNullChecks
    address: req.address,
    // @ts-expect-error StrictNullChecks
    community: req.community,
    reactionId,
  });

  return success(res, undefined);
};
