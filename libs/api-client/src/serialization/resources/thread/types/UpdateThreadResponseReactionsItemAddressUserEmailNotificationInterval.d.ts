/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateThreadResponseReactionsItemAddressUserEmailNotificationInterval: core.serialization.Schema<
  serializers.UpdateThreadResponseReactionsItemAddressUserEmailNotificationInterval.Raw,
  CommonApi.UpdateThreadResponseReactionsItemAddressUserEmailNotificationInterval
>;
export declare namespace UpdateThreadResponseReactionsItemAddressUserEmailNotificationInterval {
  type Raw = 'weekly' | 'never';
}
