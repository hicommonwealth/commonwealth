/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { CreateGroupResponseContestManagersItemTopicsItem } from "./CreateGroupResponseContestManagersItemTopicsItem";
import { CreateGroupResponseContestManagersItemContestsItem } from "./CreateGroupResponseContestManagersItemContestsItem";
export declare const CreateGroupResponseContestManagersItem: core.serialization.ObjectSchema<serializers.CreateGroupResponseContestManagersItem.Raw, CommonApi.CreateGroupResponseContestManagersItem>;
export declare namespace CreateGroupResponseContestManagersItem {
    interface Raw {
        contest_address: string;
        community_id: string;
        name: string;
        image_url?: string | null;
        funding_token_address?: string | null;
        prize_percentage?: number | null;
        payout_structure: number[];
        interval: number;
        ticker?: string | null;
        decimals?: number | null;
        created_at: string;
        cancelled?: boolean | null;
        ended?: boolean | null;
        topics?: CreateGroupResponseContestManagersItemTopicsItem.Raw[] | null;
        contests?: CreateGroupResponseContestManagersItemContestsItem.Raw[] | null;
    }
}
