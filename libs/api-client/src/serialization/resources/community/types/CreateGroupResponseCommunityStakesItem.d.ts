/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateGroupResponseCommunityStakesItemStakeTransactionsItem } from './CreateGroupResponseCommunityStakesItemStakeTransactionsItem';
export declare const CreateGroupResponseCommunityStakesItem: core.serialization.ObjectSchema<
  serializers.CreateGroupResponseCommunityStakesItem.Raw,
  CommonApi.CreateGroupResponseCommunityStakesItem
>;
export declare namespace CreateGroupResponseCommunityStakesItem {
  interface Raw {
    id?: number | null;
    community_id: string;
    stake_id?: number | null;
    stake_token?: string | null;
    vote_weight?: number | null;
    stake_enabled?: boolean | null;
    StakeTransactions?:
      | CreateGroupResponseCommunityStakesItemStakeTransactionsItem.Raw[]
      | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
