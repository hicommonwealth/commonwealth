/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const GetCommentsResponseResultsItemReactionAddressUserProfileTagsItem: core.serialization.ObjectSchema<
  serializers.GetCommentsResponseResultsItemReactionAddressUserProfileTagsItem.Raw,
  CommonApi.GetCommentsResponseResultsItemReactionAddressUserProfileTagsItem
>;
export declare namespace GetCommentsResponseResultsItemReactionAddressUserProfileTagsItem {
  interface Raw {
    user_id: number;
    tag_id: number;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
