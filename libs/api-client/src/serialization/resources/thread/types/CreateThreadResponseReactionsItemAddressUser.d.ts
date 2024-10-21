/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateThreadResponseReactionsItemAddressUserApiKey } from './CreateThreadResponseReactionsItemAddressUserApiKey';
import { CreateThreadResponseReactionsItemAddressUserEmailNotificationInterval } from './CreateThreadResponseReactionsItemAddressUserEmailNotificationInterval';
import { CreateThreadResponseReactionsItemAddressUserProfile } from './CreateThreadResponseReactionsItemAddressUserProfile';
import { CreateThreadResponseReactionsItemAddressUserProfileTagsItem } from './CreateThreadResponseReactionsItemAddressUserProfileTagsItem';
export declare const CreateThreadResponseReactionsItemAddressUser: core.serialization.ObjectSchema<
  serializers.CreateThreadResponseReactionsItemAddressUser.Raw,
  CommonApi.CreateThreadResponseReactionsItemAddressUser
>;
export declare namespace CreateThreadResponseReactionsItemAddressUser {
  interface Raw {
    id?: number | null;
    email?: string | null;
    isAdmin?: boolean | null;
    disableRichText?: boolean | null;
    emailVerified?: boolean | null;
    selected_community_id?: string | null;
    emailNotificationInterval?: CreateThreadResponseReactionsItemAddressUserEmailNotificationInterval.Raw | null;
    promotional_emails_enabled?: boolean | null;
    is_welcome_onboard_flow_complete?: boolean | null;
    profile: CreateThreadResponseReactionsItemAddressUserProfile.Raw;
    xp_points?: number | null;
    ProfileTags?:
      | CreateThreadResponseReactionsItemAddressUserProfileTagsItem.Raw[]
      | null;
    ApiKey?: CreateThreadResponseReactionsItemAddressUserApiKey.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
