/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateCommunityResponseCommunityStakesItemStakeTransactionsItemStakeDirection } from './UpdateCommunityResponseCommunityStakesItemStakeTransactionsItemStakeDirection';

export declare const UpdateCommunityResponseCommunityStakesItemStakeTransactionsItem: core.serialization.ObjectSchema<
  serializers.UpdateCommunityResponseCommunityStakesItemStakeTransactionsItem.Raw,
  CommonApi.UpdateCommunityResponseCommunityStakesItemStakeTransactionsItem
>;
export declare namespace UpdateCommunityResponseCommunityStakesItemStakeTransactionsItem {
  interface Raw {
    transaction_hash: string;
    community_id: string;
    stake_id?: number | null;
    address: string;
    stake_amount: number;
    stake_price?: string | null;
    stake_direction: UpdateCommunityResponseCommunityStakesItemStakeTransactionsItemStakeDirection.Raw;
    timestamp: number;
  }
}
