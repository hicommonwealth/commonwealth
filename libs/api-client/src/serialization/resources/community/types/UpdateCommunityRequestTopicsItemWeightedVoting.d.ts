/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateCommunityRequestTopicsItemWeightedVoting: core.serialization.Schema<
  serializers.UpdateCommunityRequestTopicsItemWeightedVoting.Raw,
  CommonApi.UpdateCommunityRequestTopicsItemWeightedVoting
>;
export declare namespace UpdateCommunityRequestTopicsItemWeightedVoting {
  type Raw = 'stake' | 'erc20';
}
