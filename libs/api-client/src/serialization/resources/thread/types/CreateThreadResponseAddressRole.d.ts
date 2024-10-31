/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateThreadResponseAddressRole: core.serialization.Schema<
  serializers.CreateThreadResponseAddressRole.Raw,
  CommonApi.CreateThreadResponseAddressRole
>;
export declare namespace CreateThreadResponseAddressRole {
  type Raw = 'admin' | 'moderator' | 'member';
}
