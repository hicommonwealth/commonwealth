/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItem } from "./GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItem";
export declare const GetCommunitiesResponseResultsItemCommunityStakesItem: core.serialization.ObjectSchema<serializers.GetCommunitiesResponseResultsItemCommunityStakesItem.Raw, CommonApi.GetCommunitiesResponseResultsItemCommunityStakesItem>;
export declare namespace GetCommunitiesResponseResultsItemCommunityStakesItem {
    interface Raw {
        id?: number | null;
        community_id: string;
        stake_id?: number | null;
        stake_token?: string | null;
        vote_weight?: number | null;
        stake_enabled?: boolean | null;
        StakeTransactions?: GetCommunitiesResponseResultsItemCommunityStakesItemStakeTransactionsItem.Raw[] | null;
        created_at?: string | null;
        updated_at?: string | null;
    }
}
