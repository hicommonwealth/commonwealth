/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommunityResponseAddressesAdminsAndModsItemRole } from './GetCommunityResponseAddressesAdminsAndModsItemRole';
export declare const GetCommunityResponseAddressesAdminsAndModsItem: core.serialization.ObjectSchema<
  serializers.GetCommunityResponseAddressesAdminsAndModsItem.Raw,
  CommonApi.GetCommunityResponseAddressesAdminsAndModsItem
>;
export declare namespace GetCommunityResponseAddressesAdminsAndModsItem {
  interface Raw {
    address: string;
    role: GetCommunityResponseAddressesAdminsAndModsItemRole.Raw;
  }
}
