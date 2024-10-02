/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType } from "./UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType";
export declare const UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceTokenId: core.serialization.ObjectSchema<serializers.UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceTokenId.Raw, CommonApi.UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceTokenId>;
export declare namespace UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceTokenId {
    interface Raw {
        source_type: UpdateCommunityResponseGroupsItemRequirementsItemThresholdDataSourceTokenIdSourceType.Raw;
        evm_chain_id: number;
        contract_address: string;
        token_id?: string | null;
    }
}
