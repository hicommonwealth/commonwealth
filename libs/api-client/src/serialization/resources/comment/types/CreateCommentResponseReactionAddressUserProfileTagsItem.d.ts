/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const CreateCommentResponseReactionAddressUserProfileTagsItem: core.serialization.ObjectSchema<
  serializers.CreateCommentResponseReactionAddressUserProfileTagsItem.Raw,
  CommonApi.CreateCommentResponseReactionAddressUserProfileTagsItem
>;
export declare namespace CreateCommentResponseReactionAddressUserProfileTagsItem {
  interface Raw {
    user_id: number;
    tag_id: number;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
