/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommentsResponseResultsItemReactionAddress } from './GetCommentsResponseResultsItemReactionAddress';

export declare const GetCommentsResponseResultsItemReaction: core.serialization.ObjectSchema<
  serializers.GetCommentsResponseResultsItemReaction.Raw,
  CommonApi.GetCommentsResponseResultsItemReaction
>;
export declare namespace GetCommentsResponseResultsItemReaction {
  interface Raw {
    id?: number | null;
    address_id: number;
    reaction: 'like';
    thread_id?: number | null;
    comment_id?: number | null;
    proposal_id?: number | null;
    calculated_voting_weight?: number | null;
    canvas_signed_data?: unknown | null;
    canvas_msg_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    Address?: GetCommentsResponseResultsItemReactionAddress.Raw | null;
  }
}
