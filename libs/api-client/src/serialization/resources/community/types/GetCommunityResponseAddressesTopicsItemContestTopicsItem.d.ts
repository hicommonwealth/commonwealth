/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
export declare const GetCommunityResponseAddressesTopicsItemContestTopicsItem: core.serialization.ObjectSchema<serializers.GetCommunityResponseAddressesTopicsItemContestTopicsItem.Raw, CommonApi.GetCommunityResponseAddressesTopicsItemContestTopicsItem>;
export declare namespace GetCommunityResponseAddressesTopicsItemContestTopicsItem {
    interface Raw {
        contest_address: string;
        topic_id: number;
        created_at: string;
    }
}
