/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSource } from './GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSource';

export const GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdData =
  core.serialization.object({
    threshold: core.serialization.string(),
    source:
      GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSource,
  });
