/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateThreadResponseTopicContestTopicsItem } from './UpdateThreadResponseTopicContestTopicsItem';
import { UpdateThreadResponseTopicWeightedVoting } from './UpdateThreadResponseTopicWeightedVoting';

export declare const UpdateThreadResponseTopic: core.serialization.ObjectSchema<
  serializers.UpdateThreadResponseTopic.Raw,
  CommonApi.UpdateThreadResponseTopic
>;
export declare namespace UpdateThreadResponseTopic {
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
    weighted_voting?: UpdateThreadResponseTopicWeightedVoting.Raw | null;
    chain_node_id?: number | null;
    token_address?: string | null;
    token_symbol?: string | null;
    vote_weight_multiplier?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    contest_topics?: UpdateThreadResponseTopicContestTopicsItem.Raw[] | null;
  }
}
