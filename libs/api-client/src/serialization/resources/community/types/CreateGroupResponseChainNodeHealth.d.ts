/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
export declare const CreateGroupResponseChainNodeHealth: core.serialization.Schema<serializers.CreateGroupResponseChainNodeHealth.Raw, CommonApi.CreateGroupResponseChainNodeHealth>;
export declare namespace CreateGroupResponseChainNodeHealth {
    type Raw = "failed" | "healthy";
}
