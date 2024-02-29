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
  InvalidThreadId: 'Invalid thread ID',
};

type CreateThreadReactionRequestParams = { id: string };
type CreateThreadReactionRequestBody = {
  reaction: string;
} & CanvasArguments;
type CreateThreadReactionResponse = ReactionAttributes;

export const createThreadReactionHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<
    CreateThreadReactionRequestBody,
    any,
    CreateThreadReactionRequestParams
  >,
  res: TypedResponse<CreateThreadReactionResponse>,
) => {
  const { user, address } = req;
  const { reaction } = req.body;

  if (!reaction) {
    throw new AppError(Errors.InvalidReaction);
  }

  const threadId = parseInt(req.params.id, 10);
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadId);
  }

  if (process.env.ENFORCE_SESSION_KEYS === 'true') {
    const parsedCanvasArguments = await unpackCanvasArguments(req.body);
    await verifyReaction(parsedCanvasArguments, {
      thread_id: threadId,
      address: address.address,
      value: reaction,
    });
  }

  // create thread reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadReaction({
      user,
      address,
      reaction,
      threadId,
      canvasActionMessage: req.body.canvas_action_message,
      canvasActionMessageSignature: req.body.canvas_action_message_signature,
      canvasSessionMessage: req.body.canvas_session_message,
      canvasSessionMessageSignature: req.body.canvas_session_message_signature,
    });

  // update address last active
  address.last_active = new Date();
  address.save().catch(console.error);

  // emit notification
  controllers.notifications.emit(notificationOptions).catch(console.error);

  // track analytics event
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, newReaction);
};
