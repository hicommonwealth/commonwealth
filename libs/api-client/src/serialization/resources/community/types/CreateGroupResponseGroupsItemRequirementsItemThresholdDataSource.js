/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceOne } from './CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceOne';
import { CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceThree } from './CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceThree';
import { CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceTokenId } from './CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceTokenId';
import { CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceTokenSymbol } from './CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceTokenSymbol';
export const CreateGroupResponseGroupsItemRequirementsItemThresholdDataSource =
  core.serialization.undiscriminatedUnion([
    CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceTokenId,
    CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceOne,
    CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceTokenSymbol,
    CreateGroupResponseGroupsItemRequirementsItemThresholdDataSourceThree,
  ]);
