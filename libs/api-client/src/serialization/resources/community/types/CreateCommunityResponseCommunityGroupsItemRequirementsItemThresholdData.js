/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSource } from './CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSource';

export const CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdData =
  core.serialization.object({
    threshold: core.serialization.string(),
    source:
      CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSource,
  });
