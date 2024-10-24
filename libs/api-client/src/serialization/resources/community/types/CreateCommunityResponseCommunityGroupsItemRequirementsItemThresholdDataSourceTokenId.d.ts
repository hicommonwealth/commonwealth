/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType } from './CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType';
export declare const CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceTokenId: core.serialization.ObjectSchema<
  serializers.CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceTokenId.Raw,
  CommonApi.CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceTokenId
>;
export declare namespace CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceTokenId {
  interface Raw {
    source_type: CreateCommunityResponseCommunityGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType.Raw;
    evm_chain_id: number;
    contract_address: string;
    token_id?: string | null;
  }
}
