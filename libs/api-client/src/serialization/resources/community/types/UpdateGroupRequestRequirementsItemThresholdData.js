/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateGroupRequestRequirementsItemThresholdDataSource } from './UpdateGroupRequestRequirementsItemThresholdDataSource';

export const UpdateGroupRequestRequirementsItemThresholdData =
  core.serialization.object({
    threshold: core.serialization.string(),
    source: UpdateGroupRequestRequirementsItemThresholdDataSource,
  });
