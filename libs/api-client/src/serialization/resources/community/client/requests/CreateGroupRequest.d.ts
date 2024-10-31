/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../../api/index';
import * as core from '../../../../../core';
import * as serializers from '../../../../index';
import { CreateGroupRequestMetadata } from '../../types/CreateGroupRequestMetadata';
import { CreateGroupRequestRequirementsItem } from '../../types/CreateGroupRequestRequirementsItem';
export declare const CreateGroupRequest: core.serialization.Schema<
  serializers.CreateGroupRequest.Raw,
  CommonApi.CreateGroupRequest
>;
export declare namespace CreateGroupRequest {
  interface Raw {
    community_id: string;
    metadata: CreateGroupRequestMetadata.Raw;
    requirements?: CreateGroupRequestRequirementsItem.Raw[] | null;
    topics?: number[] | null;
  }
}
