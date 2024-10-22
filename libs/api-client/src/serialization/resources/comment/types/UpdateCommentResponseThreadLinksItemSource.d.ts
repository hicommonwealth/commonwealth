/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const UpdateCommentResponseThreadLinksItemSource: core.serialization.Schema<
  serializers.UpdateCommentResponseThreadLinksItemSource.Raw,
  CommonApi.UpdateCommentResponseThreadLinksItemSource
>;
export declare namespace UpdateCommentResponseThreadLinksItemSource {
  type Raw = 'snapshot' | 'proposal' | 'thread' | 'web' | 'template';
}
