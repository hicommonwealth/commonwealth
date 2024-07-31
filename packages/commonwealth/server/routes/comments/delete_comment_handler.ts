import { CommentAttributes } from '@hicommonwealth/model';
import {
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyDeleteComment,
} from '@hicommonwealth/shared';
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
      commentFields.commentMsgId =
        canvasSignedData.actionMessage.payload.args.comment_id;

      await verifyDeleteComment(canvasSignedData, {});
    }
  }

  await controllers.comments.deleteComment(commentFields);

  return success(res, undefined);
};
