/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateCommentReactionResponseAddressUserApiKey } from './CreateCommentReactionResponseAddressUserApiKey';
import { CreateCommentReactionResponseAddressUserEmailNotificationInterval } from './CreateCommentReactionResponseAddressUserEmailNotificationInterval';
import { CreateCommentReactionResponseAddressUserProfile } from './CreateCommentReactionResponseAddressUserProfile';
import { CreateCommentReactionResponseAddressUserProfileTagsItem } from './CreateCommentReactionResponseAddressUserProfileTagsItem';
export declare const CreateCommentReactionResponseAddressUser: core.serialization.ObjectSchema<
  serializers.CreateCommentReactionResponseAddressUser.Raw,
  CommonApi.CreateCommentReactionResponseAddressUser
>;
export declare namespace CreateCommentReactionResponseAddressUser {
  interface Raw {
    id?: number | null;
    email?: string | null;
    isAdmin?: boolean | null;
    disableRichText?: boolean | null;
    emailVerified?: boolean | null;
    selected_community_id?: string | null;
    emailNotificationInterval?: CreateCommentReactionResponseAddressUserEmailNotificationInterval.Raw | null;
    promotional_emails_enabled?: boolean | null;
    is_welcome_onboard_flow_complete?: boolean | null;
    profile: CreateCommentReactionResponseAddressUserProfile.Raw;
    xp_points?: number | null;
    ProfileTags?:
      | CreateCommentReactionResponseAddressUserProfileTagsItem.Raw[]
      | null;
    ApiKey?: CreateCommentReactionResponseAddressUserApiKey.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
