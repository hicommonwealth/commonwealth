import { TypedRequest, TypedResponse, success } from '../../types';
import { AppError } from 'common-common/src/errors';
import { ReactionAttributes } from '../../models/reaction';
import { ServerControllers } from '../../routing/router';

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
  res: TypedResponse<CreateThreadReactionResponse>
) => {
  const { user, address, chain } = req;
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

  // create thread reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadReaction({
      user,
      address,
      chain,
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
  controllers.analytics.track(analyticsOptions).catch(console.error);

  return success(res, newReaction);
};
