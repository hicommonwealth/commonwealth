/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceThreeSourceType } from './UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceThreeSourceType';
export declare const UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceThree: core.serialization.ObjectSchema<
  serializers.UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceThree.Raw,
  CommonApi.UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceThree
>;
export declare namespace UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceThree {
  interface Raw {
    source_type: UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceThreeSourceType.Raw;
    cosmos_chain_id: string;
    contract_address: string;
  }
}
