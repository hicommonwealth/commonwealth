/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { GetCommentsResponseResultsItemThreadReactionsItemAddressUserEmailNotificationInterval } from "./GetCommentsResponseResultsItemThreadReactionsItemAddressUserEmailNotificationInterval";
import { GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfile } from "./GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfile";
import { GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileTagsItem } from "./GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileTagsItem";
export declare const GetCommentsResponseResultsItemThreadReactionsItemAddressUser: core.serialization.ObjectSchema<serializers.GetCommentsResponseResultsItemThreadReactionsItemAddressUser.Raw, CommonApi.GetCommentsResponseResultsItemThreadReactionsItemAddressUser>;
export declare namespace GetCommentsResponseResultsItemThreadReactionsItemAddressUser {
    interface Raw {
        id?: number | null;
        email?: string | null;
        isAdmin?: boolean | null;
        disableRichText?: boolean | null;
        emailVerified?: boolean | null;
        selected_community_id?: string | null;
        emailNotificationInterval?: GetCommentsResponseResultsItemThreadReactionsItemAddressUserEmailNotificationInterval.Raw | null;
        promotional_emails_enabled?: boolean | null;
        is_welcome_onboard_flow_complete?: boolean | null;
        profile: GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfile.Raw;
        ProfileTags?: GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileTagsItem.Raw[] | null;
        created_at?: string | null;
        updated_at?: string | null;
    }
}
