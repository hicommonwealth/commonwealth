/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { GetCommunitiesResponseResultsItem } from './GetCommunitiesResponseResultsItem';

export const GetCommunitiesResponse = core.serialization.object({
  limit: core.serialization.number(),
  page: core.serialization.number(),
  totalPages: core.serialization.number(),
  totalResults: core.serialization.number(),
  results: core.serialization.list(GetCommunitiesResponseResultsItem),
});
