/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateCommentResponseThreadReactionsItemAddressUserApiKey } from './CreateCommentResponseThreadReactionsItemAddressUserApiKey';
import { CreateCommentResponseThreadReactionsItemAddressUserEmailNotificationInterval } from './CreateCommentResponseThreadReactionsItemAddressUserEmailNotificationInterval';
import { CreateCommentResponseThreadReactionsItemAddressUserProfile } from './CreateCommentResponseThreadReactionsItemAddressUserProfile';
import { CreateCommentResponseThreadReactionsItemAddressUserProfileTagsItem } from './CreateCommentResponseThreadReactionsItemAddressUserProfileTagsItem';
export declare const CreateCommentResponseThreadReactionsItemAddressUser: core.serialization.ObjectSchema<
  serializers.CreateCommentResponseThreadReactionsItemAddressUser.Raw,
  CommonApi.CreateCommentResponseThreadReactionsItemAddressUser
>;
export declare namespace CreateCommentResponseThreadReactionsItemAddressUser {
  interface Raw {
    id?: number | null;
    email?: string | null;
    isAdmin?: boolean | null;
    disableRichText?: boolean | null;
    emailVerified?: boolean | null;
    selected_community_id?: string | null;
    emailNotificationInterval?: CreateCommentResponseThreadReactionsItemAddressUserEmailNotificationInterval.Raw | null;
    promotional_emails_enabled?: boolean | null;
    is_welcome_onboard_flow_complete?: boolean | null;
    profile: CreateCommentResponseThreadReactionsItemAddressUserProfile.Raw;
    xp_points?: number | null;
    ProfileTags?:
      | CreateCommentResponseThreadReactionsItemAddressUserProfileTagsItem.Raw[]
      | null;
    ApiKey?: CreateCommentResponseThreadReactionsItemAddressUserApiKey.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
