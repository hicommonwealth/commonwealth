/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateCommunityResponseCommunityBase: core.serialization.Schema<
  serializers.CreateCommunityResponseCommunityBase.Raw,
  CommonApi.CreateCommunityResponseCommunityBase
>;
export declare namespace CreateCommunityResponseCommunityBase {
  type Raw = 'cosmos' | 'substrate' | 'ethereum' | 'near' | 'solana';
}
