import { AppError } from '@hicommonwealth/core';
import { ReactionAttributes } from '@hicommonwealth/model';
import { verifyReaction } from '../../../shared/canvas/serverVerify';
import { config } from '../../config';
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
    // @ts-expect-error StrictNullChecks
    reaction,
    // @ts-expect-error StrictNullChecks
    canvas_action: canvasAction,
    // @ts-expect-error StrictNullChecks
    canvas_session: canvasSession,
    // @ts-expect-error StrictNullChecks
    canvas_hash: canvasHash,
  } = req.body;

  if (!reaction) {
    throw new AppError(Errors.InvalidReaction);
  }

  // @ts-expect-error StrictNullChecks
  const threadId = parseInt(req.params.id, 10);
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadId);
  }

  if (config.ENFORCE_SESSION_KEYS) {
    await verifyReaction(canvasAction, canvasSession, canvasHash, {
      thread_id: threadId,
      // @ts-expect-error StrictNullChecks
      address: address.address,
      value: reaction,
    });
  }

  // create thread reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadReaction({
      // @ts-expect-error StrictNullChecks
      user,
      // @ts-expect-error StrictNullChecks
      address,
      reaction,
      threadId,
      canvasAction,
      canvasSession,
      canvasHash,
    });

  // update address last active
  // @ts-expect-error StrictNullChecks
  address.last_active = new Date();
  // @ts-expect-error StrictNullChecks
  address.save().catch(console.error);

  // emit notification
  controllers.notifications.emit(notificationOptions).catch(console.error);

  // track analytics event
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, newReaction);
};
