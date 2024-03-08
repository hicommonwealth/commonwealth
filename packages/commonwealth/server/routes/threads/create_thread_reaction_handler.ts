import { AppError } from '@hicommonwealth/core';
import { ReactionAttributes } from '@hicommonwealth/model';
import { CreateThreadReactionOptions } from 'server/controllers/server_threads_methods/create_thread_reaction';
import { isCanvasSignedDataApiArgs } from 'shared/canvas/types';
import { verifyReaction } from '../../../shared/canvas/serverVerify';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

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

  const reactionFields: CreateThreadReactionOptions = {
    user,
    address,
    reaction,
    threadId,
  };

  if (process.env.ENFORCE_SESSION_KEYS === 'true') {
    if (isCanvasSignedDataApiArgs(req.body)) {
      await verifyReaction(req.body, {
        thread_id: threadId,
        address: address.address,
        value: reaction,
      });
      reactionFields.canvasAction = req.body.canvas_action;
      reactionFields.canvasSession = req.body.canvas_session;
      reactionFields.canvasHash = req.body.canvas_hash;
    }
  }

  // create thread reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadReaction(reactionFields);

  // update address last active
  address.last_active = new Date();
  address.save().catch(console.error);

  // emit notification
  controllers.notifications.emit(notificationOptions).catch(console.error);

  // track analytics event
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, newReaction);
};
