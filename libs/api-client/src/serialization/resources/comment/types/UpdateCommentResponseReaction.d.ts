/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { UpdateCommentResponseReactionAddress } from "./UpdateCommentResponseReactionAddress";
export declare const UpdateCommentResponseReaction: core.serialization.ObjectSchema<serializers.UpdateCommentResponseReaction.Raw, CommonApi.UpdateCommentResponseReaction>;
export declare namespace UpdateCommentResponseReaction {
    interface Raw {
        id?: number | null;
        address_id: number;
        reaction: "like";
        thread_id?: number | null;
        comment_id?: number | null;
        proposal_id?: number | null;
        calculated_voting_weight?: number | null;
        canvas_signed_data?: unknown | null;
        canvas_msg_id?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        Address?: UpdateCommentResponseReactionAddress.Raw | null;
    }
}
