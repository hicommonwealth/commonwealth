import { TypedRequest, TypedResponse, success } from '../../types';
import { AppError } from 'common-common/src/errors';
import { ReactionAttributes } from '../../models/reaction';
import { ServerControllers } from '../../routing/router';

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
  res: TypedResponse<CreateCommentReactionResponse>
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

  const commentId = parseInt(req.params.id, 10);
  if (!commentId) {
    throw new AppError(Errors.InvalidCommentId);
  }

  // create comment reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.comments.createCommentReaction(
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

  // emit notifications
  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  // track analytics events
  for (const a of analyticsOptions) {
    controllers.analytics.track(a).catch(console.error);
  }

  return success(res, newReaction);
};
