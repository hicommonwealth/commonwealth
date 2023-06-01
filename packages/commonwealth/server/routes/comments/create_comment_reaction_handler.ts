import { NextFunction } from 'express';
import { DB } from '../../models';
import { TypedRequest, TypedResponse, success } from '../../types';
import { AppError } from 'common-common/src/errors';
import BanCache from '../../util/banCheckCache';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';
import RuleCache from '../../util/rules/ruleCache';
import { ServerNotificationsController } from '../../controllers/server_notifications_controller';
import { ServerAnalyticsController } from '../../controllers/server_analytics_controller';
import { ServerCommentsController } from '../../controllers/server_comments_controller';
import { ReactionAttributes } from 'server/models/reaction';

const Errors = {
  InvalidReaction: 'Invalid reaction',
  InvalidCommentId: 'Invalid comment ID',
};

type CreateCommentReactionRequestParams = { id: string };
type CreateCommentReactionRequestBody = {
  reaction: string;
  canvas_action?: any;
  canvas_session?: any;
  canvas_hash?: any;
};
type CreateCommentReactionResponse = ReactionAttributes;

export const createCommentReactionHandler = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  ruleCache: RuleCache,
  banCache: BanCache,
  req: TypedRequest<
    CreateCommentReactionRequestBody,
    any,
    CreateCommentReactionRequestParams
  >,
  res: TypedResponse<CreateCommentReactionResponse>,
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

  const commentId = parseInt(req.params.id, 10);
  if (!commentId) {
    return next(new AppError(Errors.InvalidCommentId));
  }

  const serverCommentsController = new ServerCommentsController(
    models,
    tokenBalanceCache,
    ruleCache,
    banCache
  );
  const serverNotificationsController = new ServerNotificationsController(
    models
  );
  const serverAnalyticsController = new ServerAnalyticsController();

  // create comment reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await serverCommentsController.createCommentReaction(
      user,
      address,
      chain,
      reaction,
      commentId,
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
