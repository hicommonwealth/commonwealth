/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const GetCommunitiesResponseResultsItemChainNodeCosmosGovVersion: core.serialization.Schema<
  serializers.GetCommunitiesResponseResultsItemChainNodeCosmosGovVersion.Raw,
  CommonApi.GetCommunitiesResponseResultsItemChainNodeCosmosGovVersion
>;
export declare namespace GetCommunitiesResponseResultsItemChainNodeCosmosGovVersion {
  type Raw =
    | 'v1'
    | 'v1beta1govgen'
    | 'v1beta1'
    | 'v1beta1-attempt-failed'
    | 'v1-attempt-failed';
}
