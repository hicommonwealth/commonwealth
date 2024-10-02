/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItemStakeDirection } from "./GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItemStakeDirection";
export declare const GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItem: core.serialization.ObjectSchema<serializers.GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItem.Raw, CommonApi.GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItem>;
export declare namespace GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItem {
    interface Raw {
        transaction_hash: string;
        community_id: string;
        stake_id?: number | null;
        address: string;
        stake_amount: number;
        stake_price?: string | null;
        stake_direction: GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItemStakeDirection.Raw;
        timestamp: number;
    }
}
