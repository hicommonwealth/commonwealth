/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateGroupResponseRequirementsItemThresholdDataSourceOne } from './UpdateGroupResponseRequirementsItemThresholdDataSourceOne';
import { UpdateGroupResponseRequirementsItemThresholdDataSourceThree } from './UpdateGroupResponseRequirementsItemThresholdDataSourceThree';
import { UpdateGroupResponseRequirementsItemThresholdDataSourceTokenId } from './UpdateGroupResponseRequirementsItemThresholdDataSourceTokenId';
import { UpdateGroupResponseRequirementsItemThresholdDataSourceTokenSymbol } from './UpdateGroupResponseRequirementsItemThresholdDataSourceTokenSymbol';

export const UpdateGroupResponseRequirementsItemThresholdDataSource =
  core.serialization.undiscriminatedUnion([
    UpdateGroupResponseRequirementsItemThresholdDataSourceTokenId,
    UpdateGroupResponseRequirementsItemThresholdDataSourceOne,
    UpdateGroupResponseRequirementsItemThresholdDataSourceTokenSymbol,
    UpdateGroupResponseRequirementsItemThresholdDataSourceThree,
  ]);
