/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { GetUserActivityResponseItemDiscordMetaUser } from './GetUserActivityResponseItemDiscordMetaUser';
export const GetUserActivityResponseItemDiscordMeta = core.serialization.object(
  {
    user: GetUserActivityResponseItemDiscordMetaUser,
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
