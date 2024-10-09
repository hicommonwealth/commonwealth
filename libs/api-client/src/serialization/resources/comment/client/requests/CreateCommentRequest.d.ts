/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../../api/index';
import * as core from '../../../../../core';
import * as serializers from '../../../../index';
import { CreateCommentRequestDiscordMeta } from '../../types/CreateCommentRequestDiscordMeta';

export declare const CreateCommentRequest: core.serialization.Schema<
  serializers.CreateCommentRequest.Raw,
  CommonApi.CreateCommentRequest
>;
export declare namespace CreateCommentRequest {
  interface Raw {
    thread_id: number;
    thread_msg_id?: string | null;
    text: string;
    parent_id?: number | null;
    parent_msg_id?: string | null;
    canvas_signed_data?: string | null;
    canvas_msg_id?: string | null;
    discord_meta?: CreateCommentRequestDiscordMeta.Raw | null;
  }
}
