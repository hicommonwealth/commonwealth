/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { CreateCommunityResponseCommunityTermsZero } from './CreateCommunityResponseCommunityTermsZero';
export const CreateCommunityResponseCommunityTerms =
  core.serialization.undiscriminatedUnion([
    CreateCommunityResponseCommunityTermsZero,
    core.serialization.string(),
  ]);
