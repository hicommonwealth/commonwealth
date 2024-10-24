/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateThreadResponseCollaboratorsItemUserApiKey } from './CreateThreadResponseCollaboratorsItemUserApiKey';
import { CreateThreadResponseCollaboratorsItemUserEmailNotificationInterval } from './CreateThreadResponseCollaboratorsItemUserEmailNotificationInterval';
import { CreateThreadResponseCollaboratorsItemUserProfile } from './CreateThreadResponseCollaboratorsItemUserProfile';
import { CreateThreadResponseCollaboratorsItemUserProfileTagsItem } from './CreateThreadResponseCollaboratorsItemUserProfileTagsItem';
export declare const CreateThreadResponseCollaboratorsItemUser: core.serialization.ObjectSchema<
  serializers.CreateThreadResponseCollaboratorsItemUser.Raw,
  CommonApi.CreateThreadResponseCollaboratorsItemUser
>;
export declare namespace CreateThreadResponseCollaboratorsItemUser {
  interface Raw {
    id?: number | null;
    email?: string | null;
    isAdmin?: boolean | null;
    disableRichText?: boolean | null;
    emailVerified?: boolean | null;
    selected_community_id?: string | null;
    emailNotificationInterval?: CreateThreadResponseCollaboratorsItemUserEmailNotificationInterval.Raw | null;
    promotional_emails_enabled?: boolean | null;
    is_welcome_onboard_flow_complete?: boolean | null;
    profile: CreateThreadResponseCollaboratorsItemUserProfile.Raw;
    xp_points?: number | null;
    ProfileTags?:
      | CreateThreadResponseCollaboratorsItemUserProfileTagsItem.Raw[]
      | null;
    ApiKey?: CreateThreadResponseCollaboratorsItemUserApiKey.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
