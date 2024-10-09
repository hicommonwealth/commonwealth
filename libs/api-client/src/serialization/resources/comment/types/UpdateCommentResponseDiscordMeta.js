/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateCommentResponseDiscordMetaUser } from './UpdateCommentResponseDiscordMetaUser';

export const UpdateCommentResponseDiscordMeta = core.serialization.object({
  user: UpdateCommentResponseDiscordMetaUser,
  channelId: core.serialization.property(
    'channel_id',
    core.serialization.string(),
  ),
  messageId: core.serialization.property(
    'message_id',
    core.serialization.string(),
  ),
});
