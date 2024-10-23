/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommunityResponseAddresses } from './GetCommunityResponseAddresses';
export declare const GetCommunityResponse: core.serialization.Schema<
  serializers.GetCommunityResponse.Raw,
  CommonApi.GetCommunityResponse
>;
export declare namespace GetCommunityResponse {
  type Raw = GetCommunityResponseAddresses.Raw | unknown;
}
