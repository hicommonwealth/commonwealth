/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateGroupResponseRequirementsItemAllow } from './UpdateGroupResponseRequirementsItemAllow';
import { UpdateGroupResponseRequirementsItemThreshold } from './UpdateGroupResponseRequirementsItemThreshold';
export const UpdateGroupResponseRequirementsItem = core.serialization
  .union('rule', {
    threshold: UpdateGroupResponseRequirementsItemThreshold,
    allow: UpdateGroupResponseRequirementsItemAllow,
  })
  .transform({
    transform: (value) => value,
    untransform: (value) => value,
  });
