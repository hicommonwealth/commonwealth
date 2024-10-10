/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { GetCommentsResponseResultsItem } from './GetCommentsResponseResultsItem';

export declare const GetCommentsResponse: core.serialization.ObjectSchema<
  serializers.GetCommentsResponse.Raw,
  CommonApi.GetCommentsResponse
>;
export declare namespace GetCommentsResponse {
  interface Raw {
    limit: number;
    page: number;
    totalPages: number;
    totalResults: number;
    results: GetCommentsResponseResultsItem.Raw[];
  }
}
