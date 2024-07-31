import { AppError } from '@hicommonwealth/core';
import {
  applyCanvasSignedData,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyDeleteReaction,
} from '@hicommonwealth/shared';
import { canvas } from 'server/federation';
import { ServerControllers } from 'server/routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

const Errors = {
  InvalidReactionId: 'Invalid reaction ID',
};

type DeleteReactionRequestBody = {
  canvas_signed_data?: string;
  canvas_msg_id?: string;
};
type DeleteReactionRequestParams = {
  id: string;
};
type DeleteReactionResponse = undefined;

export const deleteReactionHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<DeleteReactionRequestBody, {}, DeleteReactionRequestParams>,
  res: TypedResponse<DeleteReactionResponse>,
) => {
  const { id } = req.params!;
  const reactionId = parseInt(id, 10);
  if (!reactionId) {
    throw new AppError(Errors.InvalidReactionId);
  }

  if (hasCanvasSignedDataApiArgs(req.body)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    if (canvasSignedData.actionMessage.payload.name === 'unreactComment') {
      await verifyDeleteReaction(canvasSignedData, {
        comment_id: canvasSignedData.actionMessage.payload.args.comment_id,
      });
    } else if (
      canvasSignedData.actionMessage.payload.name === 'unreactThread'
    ) {
      await verifyDeleteReaction(canvasSignedData, {
        thread_id: canvasSignedData.actionMessage.payload.args.thread_id,
      });
    } else {
      throw new Error('unexpected signed message');
    }
  }

  await controllers.reactions.deleteReaction({
    // @ts-expect-error StrictNullChecks
    user: req.user,
    // @ts-expect-error StrictNullChecks
    address: req.address,
    // @ts-expect-error StrictNullChecks
    community: req.community,
    reactionId,
  });

  if (hasCanvasSignedDataApiArgs(req.body)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    await applyCanvasSignedData(canvas, canvasSignedData);
  }

  return success(res, undefined);
};
