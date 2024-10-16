/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const CreateThreadResponseReactionsItemAddressUserProfileBackgroundImage: core.serialization.ObjectSchema<
  serializers.CreateThreadResponseReactionsItemAddressUserProfileBackgroundImage.Raw,
  CommonApi.CreateThreadResponseReactionsItemAddressUserProfileBackgroundImage
>;
export declare namespace CreateThreadResponseReactionsItemAddressUserProfileBackgroundImage {
  interface Raw {
    url?: string | null;
    imageBehavior?: string | null;
  }
}
