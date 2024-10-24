/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateGroupResponseChainNodeCosmosGovVersion: core.serialization.Schema<
  serializers.CreateGroupResponseChainNodeCosmosGovVersion.Raw,
  CommonApi.CreateGroupResponseChainNodeCosmosGovVersion
>;
export declare namespace CreateGroupResponseChainNodeCosmosGovVersion {
  type Raw =
    | 'v1'
    | 'v1beta1govgen'
    | 'v1beta1'
    | 'v1beta1-attempt-failed'
    | 'v1-attempt-failed';
}
