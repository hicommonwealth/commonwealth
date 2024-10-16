/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateThreadResponseAddressUserProfileTagsItem: core.serialization.ObjectSchema<
  serializers.CreateThreadResponseAddressUserProfileTagsItem.Raw,
  CommonApi.CreateThreadResponseAddressUserProfileTagsItem
>;
export declare namespace CreateThreadResponseAddressUserProfileTagsItem {
  interface Raw {
    user_id: number;
    tag_id: number;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
