/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { GetCommunityResponseAddresses } from './GetCommunityResponseAddresses';
export const GetCommunityResponse = core.serialization.undiscriminatedUnion([
  GetCommunityResponseAddresses,
  core.serialization.unknown(),
]);
