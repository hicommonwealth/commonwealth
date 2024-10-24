/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateCommentResponseThreadCollaboratorsItemUserProfileBackgroundImage } from './UpdateCommentResponseThreadCollaboratorsItemUserProfileBackgroundImage';
export declare const UpdateCommentResponseThreadCollaboratorsItemUserProfile: core.serialization.ObjectSchema<
  serializers.UpdateCommentResponseThreadCollaboratorsItemUserProfile.Raw,
  CommonApi.UpdateCommentResponseThreadCollaboratorsItemUserProfile
>;
export declare namespace UpdateCommentResponseThreadCollaboratorsItemUserProfile {
  interface Raw {
    name?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    slug?: string | null;
    socials?: string[] | null;
    background_image?: UpdateCommentResponseThreadCollaboratorsItemUserProfileBackgroundImage.Raw | null;
  }
}
