/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdData } from './GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdData';

export declare const GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThreshold: core.serialization.ObjectSchema<
  serializers.GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThreshold.Raw,
  CommonApi.GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThreshold
>;
export declare namespace GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThreshold {
  interface Raw {
    data: GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdData.Raw;
  }
}
