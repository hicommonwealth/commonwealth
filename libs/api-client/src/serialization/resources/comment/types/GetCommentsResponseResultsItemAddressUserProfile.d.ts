/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommentsResponseResultsItemAddressUserProfileBackgroundImage } from './GetCommentsResponseResultsItemAddressUserProfileBackgroundImage';
export declare const GetCommentsResponseResultsItemAddressUserProfile: core.serialization.ObjectSchema<
  serializers.GetCommentsResponseResultsItemAddressUserProfile.Raw,
  CommonApi.GetCommentsResponseResultsItemAddressUserProfile
>;
export declare namespace GetCommentsResponseResultsItemAddressUserProfile {
  interface Raw {
    name?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    slug?: string | null;
    socials?: string[] | null;
    background_image?: GetCommentsResponseResultsItemAddressUserProfileBackgroundImage.Raw | null;
  }
}
