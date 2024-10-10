/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';

export const CreateThreadResponseThreadVersionHistoriesItem =
  core.serialization.object({
    id: core.serialization.number().optional(),
    threadId: core.serialization.property(
      'thread_id',
      core.serialization.number(),
    ),
    address: core.serialization.string(),
    body: core.serialization.string(),
    timestamp: core.serialization.date(),
    contentUrl: core.serialization.property(
      'content_url',
      core.serialization.string().optional(),
    ),
  });
