/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
export const CreateCommentResponseThreadCollaboratorsItemUserApiKey =
  core.serialization.object({
    userId: core.serialization.property(
      'user_id',
      core.serialization.number().optional(),
    ),
    hashedApiKey: core.serialization.property(
      'hashed_api_key',
      core.serialization.string(),
    ),
    salt: core.serialization.string(),
    createdAt: core.serialization.property(
      'created_at',
      core.serialization.date().optional(),
    ),
    updatedAt: core.serialization.property(
      'updated_at',
      core.serialization.date().optional(),
    ),
  });
