/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
export declare const GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceOne: core.serialization.ObjectSchema<serializers.GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceOne.Raw, CommonApi.GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceOne>;
export declare namespace GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceOne {
    interface Raw {
        source_type: "eth_native";
        evm_chain_id: number;
    }
}
