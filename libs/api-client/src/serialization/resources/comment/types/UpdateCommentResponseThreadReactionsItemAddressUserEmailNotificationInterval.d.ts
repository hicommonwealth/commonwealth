/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateCommentResponseThreadReactionsItemAddressUserEmailNotificationInterval: core.serialization.Schema<
  serializers.UpdateCommentResponseThreadReactionsItemAddressUserEmailNotificationInterval.Raw,
  CommonApi.UpdateCommentResponseThreadReactionsItemAddressUserEmailNotificationInterval
>;
export declare namespace UpdateCommentResponseThreadReactionsItemAddressUserEmailNotificationInterval {
  type Raw = 'weekly' | 'never';
}
