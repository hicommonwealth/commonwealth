/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateTopicResponseTopic } from './UpdateTopicResponseTopic';
export declare const UpdateTopicResponse: core.serialization.ObjectSchema<
  serializers.UpdateTopicResponse.Raw,
  CommonApi.UpdateTopicResponse
>;
export declare namespace UpdateTopicResponse {
  interface Raw {
    topic: UpdateTopicResponseTopic.Raw;
    user_id: number;
  }
}
