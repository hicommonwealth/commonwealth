import { AppError } from '@hicommonwealth/core';
import { ReactionAttributes } from '@hicommonwealth/model';
import { CreateCommentReactionOptions } from 'server/controllers/server_comments_methods/create_comment_reaction';
import {
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
} from 'shared/canvas/types';
import { addressSwapper } from 'shared/utils';
import { verifyReaction } from '../../../shared/canvas/serverVerify';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

const Errors = {
  InvalidReaction: 'Invalid reaction',
  InvalidCommentId: 'Invalid comment ID',
};

type CreateCommentReactionRequestParams = { id: string };
type CreateCommentReactionRequestBody = {
  reaction: string;
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
  const { reaction } = req.body;

  if (!reaction) {
    throw new AppError(Errors.InvalidReaction);
  }

  const commentId = parseInt(req.params.id, 10);
  if (!commentId) {
    throw new AppError(Errors.InvalidCommentId);
  }

  const commentReactionFields: CreateCommentReactionOptions = {
    user,
    address,
    reaction,
    commentId,
  };

  if (hasCanvasSignedDataApiArgs(req.body)) {
    commentReactionFields.canvasSignedData = req.body.canvas_signed_data;
    commentReactionFields.canvasHash = req.body.canvas_hash;

    if (process.env.ENFORCE_SESSION_KEYS === 'true') {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);

      await verifyReaction(canvasSignedData, {
        comment_id: commentId,
        address:
          canvasSignedData.actionMessage.payload.address.split(':')[0] ==
          'polkadot'
            ? addressSwapper({
                currentPrefix: 42,
                address: address.address,
              })
            : address.address,
        value: reaction,
      });
    }
  }

  // create comment reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.comments.createCommentReaction(commentReactionFields);

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
