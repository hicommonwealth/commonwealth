/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const CreateCommentResponseThreadCollaboratorsItemUserEmailNotificationInterval: core.serialization.Schema<
  serializers.CreateCommentResponseThreadCollaboratorsItemUserEmailNotificationInterval.Raw,
  CommonApi.CreateCommentResponseThreadCollaboratorsItemUserEmailNotificationInterval
>;
export declare namespace CreateCommentResponseThreadCollaboratorsItemUserEmailNotificationInterval {
  type Raw = 'weekly' | 'never';
}
