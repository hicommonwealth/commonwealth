/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { UpdateCommentResponseDiscordMeta } from "./UpdateCommentResponseDiscordMeta";
import { UpdateCommentResponseSearch } from "./UpdateCommentResponseSearch";
import { UpdateCommentResponseAddress } from "./UpdateCommentResponseAddress";
import { UpdateCommentResponseThread } from "./UpdateCommentResponseThread";
import { UpdateCommentResponseReaction } from "./UpdateCommentResponseReaction";
import { UpdateCommentResponseCommentVersionHistoriesItem } from "./UpdateCommentResponseCommentVersionHistoriesItem";
export declare const UpdateCommentResponse: core.serialization.ObjectSchema<serializers.UpdateCommentResponse.Raw, CommonApi.UpdateCommentResponse>;
export declare namespace UpdateCommentResponse {
    interface Raw {
        id?: number | null;
        thread_id: number;
        address_id: number;
        text: string;
        plaintext: string;
        parent_id?: string | null;
        content_url?: string | null;
        canvas_signed_data?: string | null;
        canvas_msg_id?: string | null;
        created_by?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        deleted_at?: string | null;
        marked_as_spam_at?: string | null;
        discord_meta?: UpdateCommentResponseDiscordMeta.Raw | null;
        reaction_count: number;
        reaction_weights_sum?: number | null;
        search: UpdateCommentResponseSearch.Raw;
        Address?: UpdateCommentResponseAddress.Raw | null;
        Thread?: UpdateCommentResponseThread.Raw | null;
        Reaction?: UpdateCommentResponseReaction.Raw | null;
        CommentVersionHistories?: UpdateCommentResponseCommentVersionHistoriesItem.Raw[] | null;
        community_id: string;
    }
}
