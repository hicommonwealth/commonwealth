import { AppError } from '@hicommonwealth/adapters';
import { verifyReaction } from '../../../shared/canvas/serverVerify';
import { ReactionAttributes } from '../../models/reaction';
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

  const threadId = parseInt(req.params.id, 10);
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadId);
  }

  if (process.env.ENFORCE_SESSION_KEYS === 'true') {
    await verifyReaction(canvasAction, canvasSession, canvasHash, {
      thread_id: threadId,
      address: address.address,
      chain: community.id,
      value: reaction,
    });
  }

  // create thread reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadReaction({
      user,
      address,
      community,
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
