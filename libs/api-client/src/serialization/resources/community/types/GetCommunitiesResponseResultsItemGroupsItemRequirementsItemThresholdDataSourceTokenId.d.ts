/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType } from './GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType';

export declare const GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSourceTokenId: core.serialization.ObjectSchema<
  serializers.GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSourceTokenId.Raw,
  CommonApi.GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSourceTokenId
>;
export declare namespace GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSourceTokenId {
  interface Raw {
    source_type: GetCommunitiesResponseResultsItemGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType.Raw;
    evm_chain_id: number;
    contract_address: string;
    token_id?: string | null;
  }
}
