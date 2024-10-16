/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const DeleteCommentResponse: core.serialization.ObjectSchema<
  serializers.DeleteCommentResponse.Raw,
  CommonApi.DeleteCommentResponse
>;
export declare namespace DeleteCommentResponse {
  interface Raw {
    comment_id: number;
    canvas_signed_data?: string | null;
    canvas_msg_id?: string | null;
  }
}
