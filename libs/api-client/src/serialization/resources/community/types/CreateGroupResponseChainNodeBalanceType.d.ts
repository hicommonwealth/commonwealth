/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateGroupResponseChainNodeBalanceType: core.serialization.Schema<
  serializers.CreateGroupResponseChainNodeBalanceType.Raw,
  CommonApi.CreateGroupResponseChainNodeBalanceType
>;
export declare namespace CreateGroupResponseChainNodeBalanceType {
  type Raw = 'terra' | 'ethereum' | 'solana' | 'cosmos' | 'near' | 'substrate';
}
