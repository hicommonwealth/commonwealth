/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateCommentResponseThreadDiscordMetaUser } from './CreateCommentResponseThreadDiscordMetaUser';

export declare const CreateCommentResponseThreadDiscordMeta: core.serialization.ObjectSchema<
  serializers.CreateCommentResponseThreadDiscordMeta.Raw,
  CommonApi.CreateCommentResponseThreadDiscordMeta
>;
export declare namespace CreateCommentResponseThreadDiscordMeta {
  interface Raw {
    user: CreateCommentResponseThreadDiscordMetaUser.Raw;
    channel_id: string;
    message_id: string;
  }
}
