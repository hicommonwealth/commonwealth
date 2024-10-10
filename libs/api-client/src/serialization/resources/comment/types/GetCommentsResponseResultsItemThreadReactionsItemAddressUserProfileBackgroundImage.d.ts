/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileBackgroundImage: core.serialization.ObjectSchema<
  serializers.GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileBackgroundImage.Raw,
  CommonApi.GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileBackgroundImage
>;
export declare namespace GetCommentsResponseResultsItemThreadReactionsItemAddressUserProfileBackgroundImage {
  interface Raw {
    url?: string | null;
    imageBehavior?: string | null;
  }
}
