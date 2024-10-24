/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateCommunityResponseContestManagersItemContestsItem } from './UpdateCommunityResponseContestManagersItemContestsItem';
import { UpdateCommunityResponseContestManagersItemTopicsItem } from './UpdateCommunityResponseContestManagersItemTopicsItem';
export const UpdateCommunityResponseContestManagersItem =
  core.serialization.object({
    contestAddress: core.serialization.property(
      'contest_address',
      core.serialization.string(),
    ),
    communityId: core.serialization.property(
      'community_id',
      core.serialization.string(),
    ),
    name: core.serialization.string(),
    imageUrl: core.serialization.property(
      'image_url',
      core.serialization.string().optional(),
    ),
    fundingTokenAddress: core.serialization.property(
      'funding_token_address',
      core.serialization.string().optional(),
    ),
    prizePercentage: core.serialization.property(
      'prize_percentage',
      core.serialization.number().optional(),
    ),
    payoutStructure: core.serialization.property(
      'payout_structure',
      core.serialization.list(core.serialization.number()),
    ),
    interval: core.serialization.number(),
    ticker: core.serialization.string().optional(),
    decimals: core.serialization.number().optional(),
    createdAt: core.serialization.property(
      'created_at',
      core.serialization.date(),
    ),
    cancelled: core.serialization.boolean().optional(),
    ended: core.serialization.boolean().optional(),
    topics: core.serialization
      .list(UpdateCommunityResponseContestManagersItemTopicsItem)
      .optional(),
    contests: core.serialization
      .list(UpdateCommunityResponseContestManagersItemContestsItem)
      .optional(),
  });
