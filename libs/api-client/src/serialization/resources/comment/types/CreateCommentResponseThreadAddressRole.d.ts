/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateCommentResponseThreadAddressRole: core.serialization.Schema<
  serializers.CreateCommentResponseThreadAddressRole.Raw,
  CommonApi.CreateCommentResponseThreadAddressRole
>;
export declare namespace CreateCommentResponseThreadAddressRole {
  type Raw = 'admin' | 'moderator' | 'member';
}
