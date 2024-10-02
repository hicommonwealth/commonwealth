/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
export declare const GetCommunitiesResponseResultsItemContestManagersItemContestsItemScoreItem: core.serialization.ObjectSchema<serializers.GetCommunitiesResponseResultsItemContestManagersItemContestsItemScoreItem.Raw, CommonApi.GetCommunitiesResponseResultsItemContestManagersItemContestsItemScoreItem>;
export declare namespace GetCommunitiesResponseResultsItemContestManagersItemContestsItemScoreItem {
    interface Raw {
        creator_address: string;
        content_id: string;
        votes: number;
        prize: string;
        tickerPrize?: number | null;
    }
}
