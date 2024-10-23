/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateCommentResponseAddress } from './CreateCommentResponseAddress';
import { CreateCommentResponseCommentVersionHistoriesItem } from './CreateCommentResponseCommentVersionHistoriesItem';
import { CreateCommentResponseDiscordMeta } from './CreateCommentResponseDiscordMeta';
import { CreateCommentResponseReaction } from './CreateCommentResponseReaction';
import { CreateCommentResponseSearch } from './CreateCommentResponseSearch';
import { CreateCommentResponseThread } from './CreateCommentResponseThread';
export declare const CreateCommentResponse: core.serialization.ObjectSchema<
  serializers.CreateCommentResponse.Raw,
  CommonApi.CreateCommentResponse
>;
export declare namespace CreateCommentResponse {
  interface Raw {
    id?: number | null;
    thread_id: number;
    address_id: number;
    text: string;
    parent_id?: string | null;
    content_url?: string | null;
    canvas_signed_data?: string | null;
    canvas_msg_id?: string | null;
    created_by?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    marked_as_spam_at?: string | null;
    discord_meta?: CreateCommentResponseDiscordMeta.Raw | null;
    reaction_count: number;
    reaction_weights_sum?: number | null;
    search: CreateCommentResponseSearch.Raw;
    Address?: CreateCommentResponseAddress.Raw | null;
    Thread?: CreateCommentResponseThread.Raw | null;
    Reaction?: CreateCommentResponseReaction.Raw | null;
    CommentVersionHistories?:
      | CreateCommentResponseCommentVersionHistoriesItem.Raw[]
      | null;
    community_id: string;
  }
}
