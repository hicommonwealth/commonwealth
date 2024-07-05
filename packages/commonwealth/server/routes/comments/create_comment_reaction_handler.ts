import { AppError } from '@hicommonwealth/core';
import { ReactionAttributes } from '@hicommonwealth/model';
import {
  addressSwapper,
  applyCanvasSignedData,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyReaction,
} from '@hicommonwealth/shared';
import { canvas } from 'server';
import { CreateCommentReactionOptions } from 'server/controllers/server_comments_methods/create_comment_reaction';
import { config } from '../../config';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

const Errors = {
  InvalidReaction: 'Invalid reaction',
  InvalidCommentId: 'Invalid comment ID',
};

type CreateCommentReactionRequestParams = { id: string };
type CreateCommentReactionRequestBody = { reaction: string };
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
  // @ts-expect-error <StrictNullChecks>
  const { reaction } = req.body;

  if (!reaction) {
    throw new AppError(Errors.InvalidReaction);
  }

  // @ts-expect-error StrictNullChecks
  const commentId = parseInt(req.params.id, 10);
  if (!commentId) {
    throw new AppError(Errors.InvalidCommentId);
  }

  const commentReactionFields: CreateCommentReactionOptions = {
    // @ts-expect-error <StrictNullChecks>
    user,
    // @ts-expect-error <StrictNullChecks>
    address,
    reaction,
    commentId,
  };

  if (hasCanvasSignedDataApiArgs(req.body)) {
    commentReactionFields.canvasSignedData = req.body.canvas_signed_data;
    commentReactionFields.canvasHash = req.body.canvas_hash;

    if (config.ENFORCE_SESSION_KEYS) {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
      const canvasReaction = {
        comment_id: commentId,
        address:
          canvasSignedData.actionMessage.payload.address.split(':')[0] ==
          'polkadot'
            ? addressSwapper({
                currentPrefix: 42,
                // @ts-expect-error <StrictNullChecks>
                address: address.address,
              })
            : // @ts-expect-error <StrictNullChecks>
              address.address,
        value: reaction,
      };
      await verifyReaction(canvasSignedData, canvasReaction);
    }
  }

  // create comment reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.comments.createCommentReaction(commentReactionFields);

  // publish signed data
  if (hasCanvasSignedDataApiArgs(req.body)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    await applyCanvasSignedData(canvas, canvasSignedData);
  }

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
