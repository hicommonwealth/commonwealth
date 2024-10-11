/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../../api/index';
import * as core from '../../../../../core';
import * as serializers from '../../../../index';

export declare const DeleteGroupRequest: core.serialization.Schema<
  serializers.DeleteGroupRequest.Raw,
  CommonApi.DeleteGroupRequest
>;
export declare namespace DeleteGroupRequest {
  interface Raw {
    community_id: string;
    group_id: number;
  }
}
