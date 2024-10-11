/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const GetCommentsResponseResultsItemThreadTopicWeightedVoting: core.serialization.Schema<
  serializers.GetCommentsResponseResultsItemThreadTopicWeightedVoting.Raw,
  CommonApi.GetCommentsResponseResultsItemThreadTopicWeightedVoting
>;
export declare namespace GetCommentsResponseResultsItemThreadTopicWeightedVoting {
  type Raw = 'stake' | 'erc20';
}
