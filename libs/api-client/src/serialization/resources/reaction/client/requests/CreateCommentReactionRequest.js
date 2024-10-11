/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../../core';

export const CreateCommentReactionRequest = core.serialization.object({
  commentId: core.serialization.property(
    'comment_id',
    core.serialization.number(),
  ),
  commentMsgId: core.serialization.property(
    'comment_msg_id',
    core.serialization.string().optional(),
  ),
  canvasSignedData: core.serialization.property(
    'canvas_signed_data',
    core.serialization.string().optional(),
  ),
  canvasMsgId: core.serialization.property(
    'canvas_msg_id',
    core.serialization.string().optional(),
  ),
});
