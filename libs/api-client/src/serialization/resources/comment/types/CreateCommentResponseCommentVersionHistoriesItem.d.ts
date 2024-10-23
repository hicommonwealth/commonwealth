/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateCommentResponseCommentVersionHistoriesItem: core.serialization.ObjectSchema<
  serializers.CreateCommentResponseCommentVersionHistoriesItem.Raw,
  CommonApi.CreateCommentResponseCommentVersionHistoriesItem
>;
export declare namespace CreateCommentResponseCommentVersionHistoriesItem {
  interface Raw {
    id?: number | null;
    comment_id: number;
    text: string;
    timestamp: string;
    content_url?: string | null;
  }
}
