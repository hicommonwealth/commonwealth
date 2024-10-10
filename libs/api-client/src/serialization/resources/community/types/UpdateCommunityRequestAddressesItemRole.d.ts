/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateCommunityRequestAddressesItemRole: core.serialization.Schema<
  serializers.UpdateCommunityRequestAddressesItemRole.Raw,
  CommonApi.UpdateCommunityRequestAddressesItemRole
>;
export declare namespace UpdateCommunityRequestAddressesItemRole {
  type Raw = 'admin' | 'moderator' | 'member';
}
