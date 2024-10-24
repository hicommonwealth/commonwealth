/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const GetCommunitiesRequestOrderDirection: core.serialization.Schema<
  serializers.GetCommunitiesRequestOrderDirection.Raw,
  CommonApi.GetCommunitiesRequestOrderDirection
>;
export declare namespace GetCommunitiesRequestOrderDirection {
  type Raw = 'ASC' | 'DESC';
}
