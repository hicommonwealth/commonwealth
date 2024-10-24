/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateCommunityRequestTermsZero } from './UpdateCommunityRequestTermsZero';
export declare const UpdateCommunityRequestTerms: core.serialization.Schema<
  serializers.UpdateCommunityRequestTerms.Raw,
  CommonApi.UpdateCommunityRequestTerms
>;
export declare namespace UpdateCommunityRequestTerms {
  type Raw = UpdateCommunityRequestTermsZero.Raw | string;
}
