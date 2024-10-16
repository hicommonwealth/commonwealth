/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../../core';
import { CreateCommentRequestDiscordMeta } from '../../types/CreateCommentRequestDiscordMeta';

export const CreateCommentRequest = core.serialization.object({
  threadId: core.serialization.property(
    'thread_id',
    core.serialization.number(),
  ),
  threadMsgId: core.serialization.property(
    'thread_msg_id',
    core.serialization.string().optional(),
  ),
  text: core.serialization.string(),
  parentId: core.serialization.property(
    'parent_id',
    core.serialization.number().optional(),
  ),
  parentMsgId: core.serialization.property(
    'parent_msg_id',
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
  discordMeta: core.serialization.property(
    'discord_meta',
    CreateCommentRequestDiscordMeta.optional(),
  ),
});
