import { CommentAttributes } from '@hicommonwealth/model';
import {
  applyCanvasSignedData,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyDeleteComment,
} from '@hicommonwealth/shared';
import { canvas } from 'server';
import { DeleteCommentOptions } from 'server/controllers/server_comments_methods/delete_comment';
import { config } from '../../config';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type DeleteCommentRequestBody = {
  canvas_signed_data?: string;
  canvas_msg_id?: string;
};
type DeleteCommentRequestParams = {
  id: string;
};
type DeleteCommentResponse = CommentAttributes;

export const deleteCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<DeleteCommentRequestBody, {}, DeleteCommentRequestParams>,
  res: TypedResponse<DeleteCommentResponse>,
) => {
  const { user, address } = req;
  const { id: commentId } = req.params!;

  const commentFields: DeleteCommentOptions = {
    // @ts-expect-error StrictNullChecks
    user,
    // @ts-expect-error StrictNullChecks
    address,
    commentId: parseInt(commentId, 10),
  };
  if (hasCanvasSignedDataApiArgs(req.body)) {
    if (config.ENFORCE_SESSION_KEYS) {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
      const comment_msg_id =
        canvasSignedData.actionMessage.payload.args.comment_id; // TODO
      await verifyDeleteComment(canvasSignedData, { comment_msg_id });
    }
  }

  await controllers.comments.deleteComment(commentFields);

  // publish signed data
  if (hasCanvasSignedDataApiArgs(req.body)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    if (canvasSignedData.actionMessage.payload.args.comment_id !== null) {
      await applyCanvasSignedData(canvas, canvasSignedData);
    }
  }

  return success(res, undefined);
};
