/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateCommentResponseThreadReactionsItemAddressRole: core.serialization.Schema<
  serializers.UpdateCommentResponseThreadReactionsItemAddressRole.Raw,
  CommonApi.UpdateCommentResponseThreadReactionsItemAddressRole
>;
export declare namespace UpdateCommentResponseThreadReactionsItemAddressRole {
  type Raw = 'admin' | 'moderator' | 'member';
}
