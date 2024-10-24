/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommentsResponseResultsItemThreadAddress } from './GetCommentsResponseResultsItemThreadAddress';
import { GetCommentsResponseResultsItemThreadCollaboratorsItem } from './GetCommentsResponseResultsItemThreadCollaboratorsItem';
import { GetCommentsResponseResultsItemThreadDiscordMeta } from './GetCommentsResponseResultsItemThreadDiscordMeta';
import { GetCommentsResponseResultsItemThreadLinksItem } from './GetCommentsResponseResultsItemThreadLinksItem';
import { GetCommentsResponseResultsItemThreadReactionsItem } from './GetCommentsResponseResultsItemThreadReactionsItem';
import { GetCommentsResponseResultsItemThreadSearch } from './GetCommentsResponseResultsItemThreadSearch';
import { GetCommentsResponseResultsItemThreadThreadVersionHistoriesItem } from './GetCommentsResponseResultsItemThreadThreadVersionHistoriesItem';
import { GetCommentsResponseResultsItemThreadTopic } from './GetCommentsResponseResultsItemThreadTopic';
export declare const GetCommentsResponseResultsItemThread: core.serialization.ObjectSchema<
  serializers.GetCommentsResponseResultsItemThread.Raw,
  CommonApi.GetCommentsResponseResultsItemThread
>;
export declare namespace GetCommentsResponseResultsItemThread {
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
    links?: GetCommentsResponseResultsItemThreadLinksItem.Raw[] | null;
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
    discord_meta?: GetCommentsResponseResultsItemThreadDiscordMeta.Raw | null;
    reaction_count?: number | null;
    reaction_weights_sum?: number | null;
    comment_count?: number | null;
    activity_rank_date?: string | null;
    created_by?: string | null;
    profile_name?: string | null;
    search: GetCommentsResponseResultsItemThreadSearch.Raw;
    Address?: GetCommentsResponseResultsItemThreadAddress.Raw | null;
    topic?: GetCommentsResponseResultsItemThreadTopic.Raw | null;
    collaborators?:
      | GetCommentsResponseResultsItemThreadCollaboratorsItem.Raw[]
      | null;
    reactions?: GetCommentsResponseResultsItemThreadReactionsItem.Raw[] | null;
    ThreadVersionHistories?:
      | GetCommentsResponseResultsItemThreadThreadVersionHistoriesItem.Raw[]
      | null;
  }
}
