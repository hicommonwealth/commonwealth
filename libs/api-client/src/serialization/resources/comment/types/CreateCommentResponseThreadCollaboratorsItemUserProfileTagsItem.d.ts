/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateCommentResponseThreadCollaboratorsItemUserProfileTagsItem: core.serialization.ObjectSchema<
  serializers.CreateCommentResponseThreadCollaboratorsItemUserProfileTagsItem.Raw,
  CommonApi.CreateCommentResponseThreadCollaboratorsItemUserProfileTagsItem
>;
export declare namespace CreateCommentResponseThreadCollaboratorsItemUserProfileTagsItem {
  interface Raw {
    user_id: number;
    tag_id: number;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
