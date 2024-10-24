/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommunitiesResponseResultsItemCommunityTagsItemTag } from './GetCommunitiesResponseResultsItemCommunityTagsItemTag';
export declare const GetCommunitiesResponseResultsItemCommunityTagsItem: core.serialization.ObjectSchema<
  serializers.GetCommunitiesResponseResultsItemCommunityTagsItem.Raw,
  CommonApi.GetCommunitiesResponseResultsItemCommunityTagsItem
>;
export declare namespace GetCommunitiesResponseResultsItemCommunityTagsItem {
  interface Raw {
    community_id: string;
    tag_id: number;
    Tag?: GetCommunitiesResponseResultsItemCommunityTagsItemTag.Raw | null;
  }
}
