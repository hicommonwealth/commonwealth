/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const GetCommunitiesResponseResultsItemCommunityTagsItemTag: core.serialization.ObjectSchema<
  serializers.GetCommunitiesResponseResultsItemCommunityTagsItemTag.Raw,
  CommonApi.GetCommunitiesResponseResultsItemCommunityTagsItemTag
>;
export declare namespace GetCommunitiesResponseResultsItemCommunityTagsItemTag {
  interface Raw {
    id?: number | null;
    name: string;
  }
}
