/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateCommentResponseReactionAddressUserEmailNotificationInterval: core.serialization.Schema<
  serializers.CreateCommentResponseReactionAddressUserEmailNotificationInterval.Raw,
  CommonApi.CreateCommentResponseReactionAddressUserEmailNotificationInterval
>;
export declare namespace CreateCommentResponseReactionAddressUserEmailNotificationInterval {
  type Raw = 'weekly' | 'never';
}
