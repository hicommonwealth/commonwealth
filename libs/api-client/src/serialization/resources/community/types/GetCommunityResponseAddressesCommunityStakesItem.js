/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { GetCommunityResponseAddressesCommunityStakesItemStakeTransactionsItem } from './GetCommunityResponseAddressesCommunityStakesItemStakeTransactionsItem';
export const GetCommunityResponseAddressesCommunityStakesItem =
  core.serialization.object({
    id: core.serialization.number().optional(),
    communityId: core.serialization.property(
      'community_id',
      core.serialization.string(),
    ),
    stakeId: core.serialization.property(
      'stake_id',
      core.serialization.number().optional(),
    ),
    stakeToken: core.serialization.property(
      'stake_token',
      core.serialization.string().optional(),
    ),
    voteWeight: core.serialization.property(
      'vote_weight',
      core.serialization.number().optional(),
    ),
    stakeEnabled: core.serialization.property(
      'stake_enabled',
      core.serialization.boolean().optional(),
    ),
    stakeTransactions: core.serialization.property(
      'StakeTransactions',
      core.serialization
        .list(
          GetCommunityResponseAddressesCommunityStakesItemStakeTransactionsItem,
        )
        .optional(),
    ),
    createdAt: core.serialization.property(
      'created_at',
      core.serialization.date().optional(),
    ),
    updatedAt: core.serialization.property(
      'updated_at',
      core.serialization.date().optional(),
    ),
  });
