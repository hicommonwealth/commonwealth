/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const GetCommentsResponseResultsItemAddressRole: core.serialization.Schema<
  serializers.GetCommentsResponseResultsItemAddressRole.Raw,
  CommonApi.GetCommentsResponseResultsItemAddressRole
>;
export declare namespace GetCommentsResponseResultsItemAddressRole {
  type Raw = 'admin' | 'moderator' | 'member';
}
