/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateCommunityResponseAddressesItemUserProfileBackgroundImage: core.serialization.ObjectSchema<
  serializers.UpdateCommunityResponseAddressesItemUserProfileBackgroundImage.Raw,
  CommonApi.UpdateCommunityResponseAddressesItemUserProfileBackgroundImage
>;
export declare namespace UpdateCommunityResponseAddressesItemUserProfileBackgroundImage {
  interface Raw {
    url?: string | null;
    imageBehavior?: string | null;
  }
}
