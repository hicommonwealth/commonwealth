/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommentsResponseResultsItemAddressUserApiKey } from './GetCommentsResponseResultsItemAddressUserApiKey';
import { GetCommentsResponseResultsItemAddressUserEmailNotificationInterval } from './GetCommentsResponseResultsItemAddressUserEmailNotificationInterval';
import { GetCommentsResponseResultsItemAddressUserProfile } from './GetCommentsResponseResultsItemAddressUserProfile';
import { GetCommentsResponseResultsItemAddressUserProfileTagsItem } from './GetCommentsResponseResultsItemAddressUserProfileTagsItem';

export declare const GetCommentsResponseResultsItemAddressUser: core.serialization.ObjectSchema<
  serializers.GetCommentsResponseResultsItemAddressUser.Raw,
  CommonApi.GetCommentsResponseResultsItemAddressUser
>;
export declare namespace GetCommentsResponseResultsItemAddressUser {
  interface Raw {
    id?: number | null;
    email?: string | null;
    isAdmin?: boolean | null;
    disableRichText?: boolean | null;
    emailVerified?: boolean | null;
    selected_community_id?: string | null;
    emailNotificationInterval?: GetCommentsResponseResultsItemAddressUserEmailNotificationInterval.Raw | null;
    promotional_emails_enabled?: boolean | null;
    is_welcome_onboard_flow_complete?: boolean | null;
    profile: GetCommentsResponseResultsItemAddressUserProfile.Raw;
    xp_points?: number | null;
    ProfileTags?:
      | GetCommentsResponseResultsItemAddressUserProfileTagsItem.Raw[]
      | null;
    ApiKey?: GetCommentsResponseResultsItemAddressUserApiKey.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
