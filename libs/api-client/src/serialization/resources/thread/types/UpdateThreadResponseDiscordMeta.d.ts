/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateThreadResponseDiscordMetaUser } from './UpdateThreadResponseDiscordMetaUser';
export declare const UpdateThreadResponseDiscordMeta: core.serialization.ObjectSchema<
  serializers.UpdateThreadResponseDiscordMeta.Raw,
  CommonApi.UpdateThreadResponseDiscordMeta
>;
export declare namespace UpdateThreadResponseDiscordMeta {
  interface Raw {
    user: UpdateThreadResponseDiscordMetaUser.Raw;
    channel_id: string;
    message_id: string;
  }
}
