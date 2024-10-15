/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetUserActivityResponseItemRecentCommentsItemDiscordMeta } from './GetUserActivityResponseItemRecentCommentsItemDiscordMeta';
export declare const GetUserActivityResponseItemRecentCommentsItem: core.serialization.ObjectSchema<
  serializers.GetUserActivityResponseItemRecentCommentsItem.Raw,
  CommonApi.GetUserActivityResponseItemRecentCommentsItem
>;
export declare namespace GetUserActivityResponseItemRecentCommentsItem {
  interface Raw {
    id: number;
    address: string;
    user_id?: number | null;
    profile_name?: string | null;
    profile_avatar?: string | null;
    text: string;
    created_at: string;
    updated_at?: string | null;
    deleted_at?: string | null;
    marked_as_spam_at?: string | null;
    discord_meta?: GetUserActivityResponseItemRecentCommentsItemDiscordMeta.Raw | null;
  }
}
