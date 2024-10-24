/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateCommentResponseThreadAddressUserProfileBackgroundImage } from './UpdateCommentResponseThreadAddressUserProfileBackgroundImage';
export declare const UpdateCommentResponseThreadAddressUserProfile: core.serialization.ObjectSchema<
  serializers.UpdateCommentResponseThreadAddressUserProfile.Raw,
  CommonApi.UpdateCommentResponseThreadAddressUserProfile
>;
export declare namespace UpdateCommentResponseThreadAddressUserProfile {
  interface Raw {
    name?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    slug?: string | null;
    socials?: string[] | null;
    background_image?: UpdateCommentResponseThreadAddressUserProfileBackgroundImage.Raw | null;
  }
}
