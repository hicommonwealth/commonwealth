import { AppError } from '@hicommonwealth/adapters';
import { ReactionAttributes } from '@hicommonwealth/model';
import { verifyReaction } from '../../../shared/canvas/serverVerify';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

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
  controllers: ServerControllers,
  req: TypedRequest<
    CreateCommentReactionRequestBody,
    any,
    CreateCommentReactionRequestParams
  >,
  res: TypedResponse<CreateCommentReactionResponse>,
) => {
  const { user, address, chain: community } = req;
  const {
    reaction,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
  } = req.body;

  if (!reaction) {
    throw new AppError(Errors.InvalidReaction);
  }

  const commentId = parseInt(req.params.id, 10);
  if (!commentId) {
    throw new AppError(Errors.InvalidCommentId);
  }

  if (process.env.ENFORCE_SESSION_KEYS === 'true') {
    await verifyReaction(canvasAction, canvasSession, canvasHash, {
      comment_id: commentId,
      address: address.address,
      chain: community.id,
      value: reaction,
    });
  }

  // create comment reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.comments.createCommentReaction({
      user,
      address,
      community,
      reaction,
      commentId,
      canvasAction,
      canvasSession,
      canvasHash,
    });

  // emit notifications
  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  // track analytics events
  for (const a of analyticsOptions) {
    controllers.analytics.track(a, req).catch(console.error);
  }

  return success(res, newReaction);
};
