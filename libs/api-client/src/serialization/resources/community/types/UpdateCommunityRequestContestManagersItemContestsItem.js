/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateCommunityRequestContestManagersItemContestsItemActionsItem } from './UpdateCommunityRequestContestManagersItemContestsItemActionsItem';
import { UpdateCommunityRequestContestManagersItemContestsItemScoreItem } from './UpdateCommunityRequestContestManagersItemContestsItemScoreItem';
export const UpdateCommunityRequestContestManagersItemContestsItem =
  core.serialization.object({
    contestAddress: core.serialization.property(
      'contest_address',
      core.serialization.string(),
    ),
    contestId: core.serialization.property(
      'contest_id',
      core.serialization.number(),
    ),
    startTime: core.serialization.property(
      'start_time',
      core.serialization.date(),
    ),
    endTime: core.serialization.property('end_time', core.serialization.date()),
    scoreUpdatedAt: core.serialization.property(
      'score_updated_at',
      core.serialization.date().optional(),
    ),
    score: core.serialization
      .list(UpdateCommunityRequestContestManagersItemContestsItemScoreItem)
      .optional(),
    actions: core.serialization
      .list(UpdateCommunityRequestContestManagersItemContestsItemActionsItem)
      .optional(),
  });
