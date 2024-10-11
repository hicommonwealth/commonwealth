/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateCommentResponseAddressUserProfileBackgroundImage: core.serialization.ObjectSchema<
  serializers.UpdateCommentResponseAddressUserProfileBackgroundImage.Raw,
  CommonApi.UpdateCommentResponseAddressUserProfileBackgroundImage
>;
export declare namespace UpdateCommentResponseAddressUserProfileBackgroundImage {
  interface Raw {
    url?: string | null;
    imageBehavior?: string | null;
  }
}
