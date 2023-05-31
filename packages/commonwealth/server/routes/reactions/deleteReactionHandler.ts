import { NextFunction } from 'express';
import { DB } from '../../models';
import { TypedRequestParams, TypedResponse, success } from '../../types';
import { AppError } from 'common-common/src/errors';
import BanCache from '../../util/banCheckCache';
import { ServerReactionsController } from '../../controllers/server_reactions_controller';

const Errors = {
  InvalidReactionId: 'Invalid reaction ID',
};

type DeleteReactionRequest = { id: string };
type DeleteReactionResponse = undefined;

export const deleteReactionHandler = async (
  models: DB,
  banCache: BanCache,
  req: TypedRequestParams<DeleteReactionRequest>,
  res: TypedResponse<DeleteReactionResponse>,
  next: NextFunction
) => {
  const reactionId = parseInt(req.params.id, 10);
  if (!reactionId) {
    return next(new AppError(Errors.InvalidReactionId));
  }
  const serverReactionsController = new ServerReactionsController(
    models,
    banCache
  );
  await serverReactionsController.deleteReaction(req.user, reactionId);
  return success(res, undefined);
};
