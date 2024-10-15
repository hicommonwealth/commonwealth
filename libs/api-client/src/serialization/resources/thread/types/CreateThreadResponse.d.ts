/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateThreadResponseAddress } from './CreateThreadResponseAddress';
import { CreateThreadResponseCollaboratorsItem } from './CreateThreadResponseCollaboratorsItem';
import { CreateThreadResponseDiscordMeta } from './CreateThreadResponseDiscordMeta';
import { CreateThreadResponseLinksItem } from './CreateThreadResponseLinksItem';
import { CreateThreadResponseReactionsItem } from './CreateThreadResponseReactionsItem';
import { CreateThreadResponseSearch } from './CreateThreadResponseSearch';
import { CreateThreadResponseThreadVersionHistoriesItem } from './CreateThreadResponseThreadVersionHistoriesItem';
import { CreateThreadResponseTopic } from './CreateThreadResponseTopic';
export declare const CreateThreadResponse: core.serialization.ObjectSchema<
  serializers.CreateThreadResponse.Raw,
  CommonApi.CreateThreadResponse
>;
export declare namespace CreateThreadResponse {
  interface Raw {
    id?: number | null;
    address_id: number;
    title: string;
    kind: string;
    stage?: string | null;
    body?: string | null;
    url?: string | null;
    topic_id?: number | null;
    pinned?: boolean | null;
    community_id: string;
    view_count?: number | null;
    links?: CreateThreadResponseLinksItem.Raw[] | null;
    content_url?: string | null;
    read_only?: boolean | null;
    has_poll?: boolean | null;
    canvas_signed_data?: string | null;
    canvas_msg_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    last_edited?: string | null;
    deleted_at?: string | null;
    last_commented_on?: string | null;
    marked_as_spam_at?: string | null;
    archived_at?: string | null;
    locked_at?: string | null;
    discord_meta?: CreateThreadResponseDiscordMeta.Raw | null;
    reaction_count?: number | null;
    reaction_weights_sum?: number | null;
    comment_count?: number | null;
    activity_rank_date?: string | null;
    created_by?: string | null;
    profile_name?: string | null;
    search: CreateThreadResponseSearch.Raw;
    Address?: CreateThreadResponseAddress.Raw | null;
    topic?: CreateThreadResponseTopic.Raw | null;
    collaborators?: CreateThreadResponseCollaboratorsItem.Raw[] | null;
    reactions?: CreateThreadResponseReactionsItem.Raw[] | null;
    ThreadVersionHistories?:
      | CreateThreadResponseThreadVersionHistoriesItem.Raw[]
      | null;
  }
}
