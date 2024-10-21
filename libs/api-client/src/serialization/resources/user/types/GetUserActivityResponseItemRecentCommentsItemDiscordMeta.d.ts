/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetUserActivityResponseItemRecentCommentsItemDiscordMetaUser } from './GetUserActivityResponseItemRecentCommentsItemDiscordMetaUser';
export declare const GetUserActivityResponseItemRecentCommentsItemDiscordMeta: core.serialization.ObjectSchema<
  serializers.GetUserActivityResponseItemRecentCommentsItemDiscordMeta.Raw,
  CommonApi.GetUserActivityResponseItemRecentCommentsItemDiscordMeta
>;
export declare namespace GetUserActivityResponseItemRecentCommentsItemDiscordMeta {
  interface Raw {
    user: GetUserActivityResponseItemRecentCommentsItemDiscordMetaUser.Raw;
    channel_id: string;
    message_id: string;
  }
}
