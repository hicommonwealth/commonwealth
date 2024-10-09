/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateCommentResponseReactionAddressUserProfileBackgroundImage } from './UpdateCommentResponseReactionAddressUserProfileBackgroundImage';

export declare const UpdateCommentResponseReactionAddressUserProfile: core.serialization.ObjectSchema<
  serializers.UpdateCommentResponseReactionAddressUserProfile.Raw,
  CommonApi.UpdateCommentResponseReactionAddressUserProfile
>;
export declare namespace UpdateCommentResponseReactionAddressUserProfile {
  interface Raw {
    name?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    slug?: string | null;
    socials?: string[] | null;
    background_image?: UpdateCommentResponseReactionAddressUserProfileBackgroundImage.Raw | null;
  }
}
