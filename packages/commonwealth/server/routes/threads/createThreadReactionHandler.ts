import { NextFunction } from 'express';
import { DB } from '../../models';
import { TypedRequestParams, TypedResponse, success } from '../../types';
import { AppError } from 'common-common/src/errors';
import BanCache from '../../util/banCheckCache';
import { ServerThreadsController } from 'server/controllers/server_threads_controller';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';
import RuleCache from 'server/util/rules/ruleCache';

const Errors = {
  InvalidThreadId: 'Invalid thread ID',
};

type CreateThreadReactionRequest = { id: string };
type CreateThreadReactionResponse = undefined;

export const createThreadReactionHandler = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  ruleCache: RuleCache,
  banCache: BanCache,
  req: TypedRequestParams<CreateThreadReactionRequest>,
  res: TypedResponse<CreateThreadReactionResponse>,
  next: NextFunction
) => {
  const chain = req.chain;
  const authorAddress = req.address;
  const threadId = parseInt(req.params.id, 10);
  if (!threadId) {
    return next(new AppError(Errors.InvalidThreadId));
  }
  const serverThreadsController = new ServerThreadsController(
    models,
    tokenBalanceCache,
    ruleCache,
    banCache
  );
  const reaction = await serverThreadsController.createThreadReaction(
    chain,
    authorAddress,
    threadId
  );
  return success(res, reaction);
};
