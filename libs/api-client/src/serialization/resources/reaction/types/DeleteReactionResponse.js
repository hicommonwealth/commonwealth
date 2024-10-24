/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
export const DeleteReactionResponse = core.serialization.object({
  reactionId: core.serialization.property(
    'reaction_id',
    core.serialization.number(),
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
