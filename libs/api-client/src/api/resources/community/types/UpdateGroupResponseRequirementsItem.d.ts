/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from "../../../index";
export declare type UpdateGroupResponseRequirementsItem = CommonApi.UpdateGroupResponseRequirementsItem.Threshold | CommonApi.UpdateGroupResponseRequirementsItem.Allow;
export declare namespace UpdateGroupResponseRequirementsItem {
    interface Threshold extends CommonApi.UpdateGroupResponseRequirementsItemThreshold {
        rule: "threshold";
    }
    interface Allow extends CommonApi.UpdateGroupResponseRequirementsItemAllow {
        rule: "allow";
    }
}
