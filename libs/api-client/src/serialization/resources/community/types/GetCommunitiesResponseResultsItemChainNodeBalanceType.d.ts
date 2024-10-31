/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const GetCommunitiesResponseResultsItemChainNodeBalanceType: core.serialization.Schema<
  serializers.GetCommunitiesResponseResultsItemChainNodeBalanceType.Raw,
  CommonApi.GetCommunitiesResponseResultsItemChainNodeBalanceType
>;
export declare namespace GetCommunitiesResponseResultsItemChainNodeBalanceType {
  type Raw = 'terra' | 'ethereum' | 'solana' | 'cosmos' | 'near' | 'substrate';
}
