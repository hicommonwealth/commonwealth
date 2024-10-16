/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommunityResponseAddressesGroupsItemMetadata } from './GetCommunityResponseAddressesGroupsItemMetadata';
import { GetCommunityResponseAddressesGroupsItemRequirementsItem } from './GetCommunityResponseAddressesGroupsItemRequirementsItem';

export declare const GetCommunityResponseAddressesGroupsItem: core.serialization.ObjectSchema<
  serializers.GetCommunityResponseAddressesGroupsItem.Raw,
  CommonApi.GetCommunityResponseAddressesGroupsItem
>;
export declare namespace GetCommunityResponseAddressesGroupsItem {
  interface Raw {
    id?: number | null;
    community_id: string;
    metadata: GetCommunityResponseAddressesGroupsItemMetadata.Raw;
    requirements: GetCommunityResponseAddressesGroupsItemRequirementsItem.Raw[];
    is_system_managed?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
