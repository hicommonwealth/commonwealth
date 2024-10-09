/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const GetCommunitiesResponseResultsItemType: core.serialization.Schema<
  serializers.GetCommunitiesResponseResultsItemType.Raw,
  CommonApi.GetCommunitiesResponseResultsItemType
>;
export declare namespace GetCommunitiesResponseResultsItemType {
  type Raw = 'chain' | 'dao' | 'token' | 'offchain';
}
