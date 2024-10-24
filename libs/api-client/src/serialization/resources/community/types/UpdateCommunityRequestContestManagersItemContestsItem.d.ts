/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateCommunityRequestContestManagersItemContestsItemActionsItem } from './UpdateCommunityRequestContestManagersItemContestsItemActionsItem';
import { UpdateCommunityRequestContestManagersItemContestsItemScoreItem } from './UpdateCommunityRequestContestManagersItemContestsItemScoreItem';
export declare const UpdateCommunityRequestContestManagersItemContestsItem: core.serialization.ObjectSchema<
  serializers.UpdateCommunityRequestContestManagersItemContestsItem.Raw,
  CommonApi.UpdateCommunityRequestContestManagersItemContestsItem
>;
export declare namespace UpdateCommunityRequestContestManagersItemContestsItem {
  interface Raw {
    contest_address: string;
    contest_id: number;
    start_time: string;
    end_time: string;
    score_updated_at?: string | null;
    score?:
      | UpdateCommunityRequestContestManagersItemContestsItemScoreItem.Raw[]
      | null;
    actions?:
      | UpdateCommunityRequestContestManagersItemContestsItemActionsItem.Raw[]
      | null;
  }
}
