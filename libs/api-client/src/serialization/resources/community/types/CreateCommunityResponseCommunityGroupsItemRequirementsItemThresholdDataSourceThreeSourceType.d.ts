/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceThreeSourceType: core.serialization.Schema<
  serializers.CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceThreeSourceType.Raw,
  CommonApi.CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceThreeSourceType
>;
export declare namespace CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceThreeSourceType {
  type Raw = 'cw721' | 'cw20';
}
