/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
export const GetNewContentResponse = core.serialization.object({
  joinedCommunityIdsWithNewContent: core.serialization.list(
    core.serialization.string(),
  ),
});
