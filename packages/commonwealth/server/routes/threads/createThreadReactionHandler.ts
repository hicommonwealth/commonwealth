import { NextFunction } from 'express';
import { DB } from '../../models';
import { TypedRequest, TypedResponse, success } from '../../types';
import { AppError } from 'common-common/src/errors';
import BanCache from '../../util/banCheckCache';
import { ServerThreadsController } from '../../controllers/server_threads_controller';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';
import RuleCache from '../../util/rules/ruleCache';
import { ServerNotificationsController } from '../../controllers/server_notifications_controller';
import { ServerAnalyticsController } from '../../controllers/server_analytics_controller';

const Errors = {
  InvalidReaction: 'Invalid reaction',
  InvalidThreadId: 'Invalid thread ID',
};

type CreateThreadReactionRequestParams = { id: string };
type CreateThreadReactionRequestBody = {
  reaction: string;
  canvas_action?: any;
  canvas_session?: any;
  canvas_hash?: any;
};
type CreateThreadReactionResponse = undefined;

export const createThreadReactionHandler = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  ruleCache: RuleCache,
  banCache: BanCache,
  req: TypedRequest<
    CreateThreadReactionRequestBody,
    any,
    CreateThreadReactionRequestParams
  >,
  res: TypedResponse<CreateThreadReactionResponse>,
  next: NextFunction
) => {
  const { user, address, chain } = req;
  const {
    reaction,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
  } = req.body;

  if (!reaction) {
    return next(new AppError(Errors.InvalidReaction));
  }

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
  const serverNotificationsController = new ServerNotificationsController(
    models
  );
  const serverAnalyticsController = new ServerAnalyticsController();

  // save thread reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await serverThreadsController.createThreadReaction(
      user,
      address,
      chain,
      reaction,
      threadId,
      canvasAction,
      canvasSession,
      canvasHash
    );

  // update address last active
  address.last_active = new Date();
  address.save().catch(console.error);

  // emit notification
  serverNotificationsController.emit(notificationOptions).catch(console.error);

  // track analytics event
  serverAnalyticsController.track(analyticsOptions).catch(console.error);

  return success(res, newReaction);
};
