/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { CreateCommentResponseThreadDiscordMetaUser } from './CreateCommentResponseThreadDiscordMetaUser';
export const CreateCommentResponseThreadDiscordMeta = core.serialization.object(
  {
    user: CreateCommentResponseThreadDiscordMetaUser,
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
