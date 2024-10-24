/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { CreateCommunityResponseCommunityGroupsItemRequirementsItemAllow } from './CreateCommunityResponseCommunityGroupsItemRequirementsItemAllow';
import { CreateCommunityResponseCommunityGroupsItemRequirementsItemThreshold } from './CreateCommunityResponseCommunityGroupsItemRequirementsItemThreshold';
export const CreateCommunityResponseCommunityGroupsItemRequirementsItem =
  core.serialization
    .union('rule', {
      threshold:
        CreateCommunityResponseCommunityGroupsItemRequirementsItemThreshold,
      allow: CreateCommunityResponseCommunityGroupsItemRequirementsItemAllow,
    })
    .transform({
      transform: (value) => value,
      untransform: (value) => value,
    });
