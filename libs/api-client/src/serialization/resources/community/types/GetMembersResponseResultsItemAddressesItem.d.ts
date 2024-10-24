/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const GetMembersResponseResultsItemAddressesItem: core.serialization.ObjectSchema<
  serializers.GetMembersResponseResultsItemAddressesItem.Raw,
  CommonApi.GetMembersResponseResultsItemAddressesItem
>;
export declare namespace GetMembersResponseResultsItemAddressesItem {
  interface Raw {
    id: number;
    community_id: string;
    address: string;
    stake_balance?: number | null;
    role: string;
  }
}
