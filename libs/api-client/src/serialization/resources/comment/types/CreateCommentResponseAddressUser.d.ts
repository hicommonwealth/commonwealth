/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { CreateCommentResponseAddressUserEmailNotificationInterval } from "./CreateCommentResponseAddressUserEmailNotificationInterval";
import { CreateCommentResponseAddressUserProfile } from "./CreateCommentResponseAddressUserProfile";
import { CreateCommentResponseAddressUserProfileTagsItem } from "./CreateCommentResponseAddressUserProfileTagsItem";
export declare const CreateCommentResponseAddressUser: core.serialization.ObjectSchema<serializers.CreateCommentResponseAddressUser.Raw, CommonApi.CreateCommentResponseAddressUser>;
export declare namespace CreateCommentResponseAddressUser {
    interface Raw {
        id?: number | null;
        email?: string | null;
        isAdmin?: boolean | null;
        disableRichText?: boolean | null;
        emailVerified?: boolean | null;
        selected_community_id?: string | null;
        emailNotificationInterval?: CreateCommentResponseAddressUserEmailNotificationInterval.Raw | null;
        promotional_emails_enabled?: boolean | null;
        is_welcome_onboard_flow_complete?: boolean | null;
        profile: CreateCommentResponseAddressUserProfile.Raw;
        ProfileTags?: CreateCommentResponseAddressUserProfileTagsItem.Raw[] | null;
        created_at?: string | null;
        updated_at?: string | null;
    }
}
