/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateGroupRequestRequirementsItemThresholdDataSourceTokenIdSourceType } from './UpdateGroupRequestRequirementsItemThresholdDataSourceTokenIdSourceType';
export declare const UpdateGroupRequestRequirementsItemThresholdDataSourceTokenId: core.serialization.ObjectSchema<
  serializers.UpdateGroupRequestRequirementsItemThresholdDataSourceTokenId.Raw,
  CommonApi.UpdateGroupRequestRequirementsItemThresholdDataSourceTokenId
>;
export declare namespace UpdateGroupRequestRequirementsItemThresholdDataSourceTokenId {
  interface Raw {
    source_type: UpdateGroupRequestRequirementsItemThresholdDataSourceTokenIdSourceType.Raw;
    evm_chain_id: number;
    contract_address: string;
    token_id?: string | null;
  }
}
