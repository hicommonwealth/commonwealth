/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { CreateCommentResponseThreadLinksItemSource } from './CreateCommentResponseThreadLinksItemSource';

export const CreateCommentResponseThreadLinksItem = core.serialization.object({
  source: CreateCommentResponseThreadLinksItemSource,
  identifier: core.serialization.string(),
  title: core.serialization.string().optional(),
});
