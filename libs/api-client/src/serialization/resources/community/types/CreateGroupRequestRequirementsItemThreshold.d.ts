/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { CreateGroupRequestRequirementsItemThresholdData } from "./CreateGroupRequestRequirementsItemThresholdData";
export declare const CreateGroupRequestRequirementsItemThreshold: core.serialization.ObjectSchema<serializers.CreateGroupRequestRequirementsItemThreshold.Raw, CommonApi.CreateGroupRequestRequirementsItemThreshold>;
export declare namespace CreateGroupRequestRequirementsItemThreshold {
    interface Raw {
        data: CreateGroupRequestRequirementsItemThresholdData.Raw;
    }
}
