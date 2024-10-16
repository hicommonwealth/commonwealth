/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';

export const CreateGroupResponseGroupsItemMetadata = core.serialization.object({
  name: core.serialization.string(),
  description: core.serialization.string(),
  requiredRequirements: core.serialization.property(
    'required_requirements',
    core.serialization.number().optional(),
  ),
  membershipTtl: core.serialization.property(
    'membership_ttl',
    core.serialization.number().optional(),
  ),
});
