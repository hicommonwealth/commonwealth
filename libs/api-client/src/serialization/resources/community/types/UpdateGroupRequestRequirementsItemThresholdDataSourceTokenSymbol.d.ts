/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateGroupRequestRequirementsItemThresholdDataSourceTokenSymbol: core.serialization.ObjectSchema<
  serializers.UpdateGroupRequestRequirementsItemThresholdDataSourceTokenSymbol.Raw,
  CommonApi.UpdateGroupRequestRequirementsItemThresholdDataSourceTokenSymbol
>;
export declare namespace UpdateGroupRequestRequirementsItemThresholdDataSourceTokenSymbol {
  interface Raw {
    source_type: 'cosmos_native';
    cosmos_chain_id: string;
    token_symbol: string;
  }
}
