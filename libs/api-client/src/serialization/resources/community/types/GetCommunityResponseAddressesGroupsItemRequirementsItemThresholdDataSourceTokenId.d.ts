/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType } from './GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType';

export declare const GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenId: core.serialization.ObjectSchema<
  serializers.GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenId.Raw,
  CommonApi.GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenId
>;
export declare namespace GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenId {
  interface Raw {
    source_type: GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType.Raw;
    evm_chain_id: number;
    contract_address: string;
    token_id?: string | null;
  }
}
