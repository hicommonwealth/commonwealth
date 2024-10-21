/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateTopicResponseTopic } from './CreateTopicResponseTopic';
export declare const CreateTopicResponse: core.serialization.ObjectSchema<
  serializers.CreateTopicResponse.Raw,
  CommonApi.CreateTopicResponse
>;
export declare namespace CreateTopicResponse {
  interface Raw {
    topic: CreateTopicResponseTopic.Raw;
    user_id: number;
  }
}
