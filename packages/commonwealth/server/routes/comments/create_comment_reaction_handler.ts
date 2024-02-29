import { AppError } from '@hicommonwealth/core';
import { ReactionAttributes } from '@hicommonwealth/model';
import {
  CanvasArguments,
  unpackCanvasArguments,
  verifyReaction,
} from '../../../shared/canvas/serverVerify';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

const Errors = {
  InvalidReaction: 'Invalid reaction',
  InvalidCommentId: 'Invalid comment ID',
};

type CreateCommentReactionRequestParams = { id: string };
type CreateCommentReactionRequestBody = {
  reaction: string;
} & CanvasArguments;
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
  const { user, address } = req;
  const { reaction } = req.body;

  if (!reaction) {
    throw new AppError(Errors.InvalidReaction);
  }

  const commentId = parseInt(req.params.id, 10);
  if (!commentId) {
    throw new AppError(Errors.InvalidCommentId);
  }

  if (process.env.ENFORCE_SESSION_KEYS === 'true') {
    const parsedCanvasArguments = await unpackCanvasArguments(req.body);
    await verifyReaction(parsedCanvasArguments, {
      comment_id: commentId,
      address: address.address,
      value: reaction,
    });
  }

  // create comment reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.comments.createCommentReaction({
      user,
      address,
      reaction,
      commentId,
      canvasActionMessage: req.body.canvas_action_message,
      canvasActionMessageSignature: req.body.canvas_action_message_signature,
      canvasSessionMessage: req.body.canvas_session_message,
      canvasSessionMessageSignature: req.body.canvas_session_message_signature,
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
