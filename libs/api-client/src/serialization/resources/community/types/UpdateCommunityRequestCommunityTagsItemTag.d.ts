/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateCommunityRequestCommunityTagsItemTag: core.serialization.ObjectSchema<
  serializers.UpdateCommunityRequestCommunityTagsItemTag.Raw,
  CommonApi.UpdateCommunityRequestCommunityTagsItemTag
>;
export declare namespace UpdateCommunityRequestCommunityTagsItemTag {
  interface Raw {
    id?: number | null;
    name: string;
  }
}
