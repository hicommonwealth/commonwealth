/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../../core';
import { UpdateGroupRequestMetadata } from '../../types/UpdateGroupRequestMetadata';
import { UpdateGroupRequestRequirementsItem } from '../../types/UpdateGroupRequestRequirementsItem';
export const UpdateGroupRequest = core.serialization.object({
  communityId: core.serialization.property(
    'community_id',
    core.serialization.string(),
  ),
  groupId: core.serialization.property('group_id', core.serialization.number()),
  metadata: UpdateGroupRequestMetadata.optional(),
  requirements: core.serialization
    .list(UpdateGroupRequestRequirementsItem)
    .optional(),
  topics: core.serialization.list(core.serialization.number()).optional(),
});
