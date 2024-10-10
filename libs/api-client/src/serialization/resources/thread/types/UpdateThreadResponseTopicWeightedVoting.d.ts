/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateThreadResponseTopicWeightedVoting: core.serialization.Schema<
  serializers.UpdateThreadResponseTopicWeightedVoting.Raw,
  CommonApi.UpdateThreadResponseTopicWeightedVoting
>;
export declare namespace UpdateThreadResponseTopicWeightedVoting {
  type Raw = 'stake' | 'erc20';
}
