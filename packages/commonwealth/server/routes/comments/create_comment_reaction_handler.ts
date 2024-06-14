import { AppError } from '@hicommonwealth/core';
import { ReactionAttributes } from '@hicommonwealth/model';
import { verifyReaction } from '../../../shared/canvas/serverVerify';
import { config } from '../../config';
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
  const commentId = parseInt(req.params.id, 10);
  if (!commentId) {
    throw new AppError(Errors.InvalidCommentId);
  }

  if (config.ENFORCE_SESSION_KEYS) {
    await verifyReaction(canvasAction, canvasSession, canvasHash, {
      comment_id: commentId,
      // @ts-expect-error StrictNullChecks
      address: address.address,
      value: reaction,
    });
  }

  // create comment reaction
  const [newReaction, analyticsOptions] =
    await controllers.comments.createCommentReaction({
      // @ts-expect-error StrictNullChecks
      user,
      // @ts-expect-error StrictNullChecks
      address,
      reaction,
      commentId,
      canvasAction,
      canvasSession,
      canvasHash,
    });

  // track analytics events
  for (const a of analyticsOptions) {
    controllers.analytics.track(a, req).catch(console.error);
  }

  return success(res, newReaction);
};
