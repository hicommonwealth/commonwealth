/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../../core';
import { CreateGroupRequestMetadata } from '../../types/CreateGroupRequestMetadata';
import { CreateGroupRequestRequirementsItem } from '../../types/CreateGroupRequestRequirementsItem';
export const CreateGroupRequest = core.serialization.object({
  communityId: core.serialization.property(
    'community_id',
    core.serialization.string(),
  ),
  metadata: CreateGroupRequestMetadata,
  requirements: core.serialization
    .list(CreateGroupRequestRequirementsItem)
    .optional(),
  topics: core.serialization.list(core.serialization.number()).optional(),
});
