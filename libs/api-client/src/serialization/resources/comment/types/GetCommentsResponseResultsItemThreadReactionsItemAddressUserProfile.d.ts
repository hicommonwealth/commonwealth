/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileBackgroundImage } from './GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileBackgroundImage';
export declare const GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfile: core.serialization.ObjectSchema<
  serializers.GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfile.Raw,
  CommonApi.GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfile
>;
export declare namespace GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfile {
  interface Raw {
    name?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    slug?: string | null;
    socials?: string[] | null;
    background_image?: GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileBackgroundImage.Raw | null;
  }
}
