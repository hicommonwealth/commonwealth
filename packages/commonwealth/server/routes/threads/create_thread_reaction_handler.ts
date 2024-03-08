import { AppError } from '@hicommonwealth/core';
import { ReactionAttributes } from '@hicommonwealth/model';
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
  const {
    reaction,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
  } = req.body;

  if (!reaction) {
    throw new AppError(Errors.InvalidReaction);
  }

  const threadId = parseInt(req.params.id, 10);
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadId);
  }

  if (process.env.ENFORCE_SESSION_KEYS === 'true') {
    if (isCanvasSignedDataApiArgs(req.body)) {
      await verifyReaction(req.body, {
        thread_id: threadId,
        address: address.address,
        value: reaction,
      });
    }
  }

  // create thread reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadReaction({
      user,
      address,
      reaction,
      threadId,
      canvasAction,
      canvasSession,
      canvasHash,
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
