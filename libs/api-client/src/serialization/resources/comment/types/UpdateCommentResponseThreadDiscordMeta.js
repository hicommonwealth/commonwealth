/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateCommentResponseThreadDiscordMetaUser } from './UpdateCommentResponseThreadDiscordMetaUser';
export const UpdateCommentResponseThreadDiscordMeta = core.serialization.object(
  {
    user: UpdateCommentResponseThreadDiscordMetaUser,
    channelId: core.serialization.property(
      'channel_id',
      core.serialization.string(),
    ),
    messageId: core.serialization.property(
      'message_id',
      core.serialization.string(),
    ),
  },
);
