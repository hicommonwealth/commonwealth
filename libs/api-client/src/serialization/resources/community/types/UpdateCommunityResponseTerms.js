/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateCommunityResponseTermsZero } from './UpdateCommunityResponseTermsZero';
export const UpdateCommunityResponseTerms =
  core.serialization.undiscriminatedUnion([
    UpdateCommunityResponseTermsZero,
    core.serialization.string(),
  ]);
