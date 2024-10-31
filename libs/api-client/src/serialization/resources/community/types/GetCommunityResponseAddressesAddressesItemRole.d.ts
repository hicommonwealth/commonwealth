/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const GetCommunityResponseAddressesAddressesItemRole: core.serialization.Schema<
  serializers.GetCommunityResponseAddressesAddressesItemRole.Raw,
  CommonApi.GetCommunityResponseAddressesAddressesItemRole
>;
export declare namespace GetCommunityResponseAddressesAddressesItemRole {
  type Raw = 'admin' | 'moderator' | 'member';
}
