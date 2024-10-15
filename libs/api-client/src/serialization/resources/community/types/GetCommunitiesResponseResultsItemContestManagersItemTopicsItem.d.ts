/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommunitiesResponseResultsItemContestManagersItemTopicsItemContestTopicsItem } from './GetCommunitiesResponseResultsItemContestManagersItemTopicsItemContestTopicsItem';
import { GetCommunitiesResponseResultsItemContestManagersItemTopicsItemWeightedVoting } from './GetCommunitiesResponseResultsItemContestManagersItemTopicsItemWeightedVoting';
export declare const GetCommunitiesResponseResultsItemContestManagersItemTopicsItem: core.serialization.ObjectSchema<
  serializers.GetCommunitiesResponseResultsItemContestManagersItemTopicsItem.Raw,
  CommonApi.GetCommunitiesResponseResultsItemContestManagersItemTopicsItem
>;
export declare namespace GetCommunitiesResponseResultsItemContestManagersItemTopicsItem {
  interface Raw {
    id?: number | null;
    name?: string | null;
    community_id: string;
    description?: string | null;
    telegram?: string | null;
    featured_in_sidebar?: boolean | null;
    featured_in_new_post?: boolean | null;
    default_offchain_template?: string | null;
    order?: number | null;
    channel_id?: string | null;
    group_ids?: number[] | null;
    default_offchain_template_backup?: string | null;
    weighted_voting?: GetCommunitiesResponseResultsItemContestManagersItemTopicsItemWeightedVoting.Raw | null;
    chain_node_id?: number | null;
    token_address?: string | null;
    token_symbol?: string | null;
    vote_weight_multiplier?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    contest_topics?:
      | GetCommunitiesResponseResultsItemContestManagersItemTopicsItemContestTopicsItem.Raw[]
      | null;
  }
}
