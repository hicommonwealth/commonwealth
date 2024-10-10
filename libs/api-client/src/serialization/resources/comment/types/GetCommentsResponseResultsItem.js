/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { GetCommentsResponseResultsItemAddress } from './GetCommentsResponseResultsItemAddress';
import { GetCommentsResponseResultsItemCommentVersionHistoriesItem } from './GetCommentsResponseResultsItemCommentVersionHistoriesItem';
import { GetCommentsResponseResultsItemDiscordMeta } from './GetCommentsResponseResultsItemDiscordMeta';
import { GetCommentsResponseResultsItemReaction } from './GetCommentsResponseResultsItemReaction';
import { GetCommentsResponseResultsItemSearch } from './GetCommentsResponseResultsItemSearch';
import { GetCommentsResponseResultsItemThread } from './GetCommentsResponseResultsItemThread';

export const GetCommentsResponseResultsItem = core.serialization.object({
  id: core.serialization.number().optional(),
  threadId: core.serialization.property(
    'thread_id',
    core.serialization.number(),
  ),
  addressId: core.serialization.property(
    'address_id',
    core.serialization.number(),
  ),
  text: core.serialization.string(),
  plaintext: core.serialization.string(),
  parentId: core.serialization.property(
    'parent_id',
    core.serialization.string().optional(),
  ),
  contentUrl: core.serialization.property(
    'content_url',
    core.serialization.string().optional(),
  ),
  canvasSignedData: core.serialization.property(
    'canvas_signed_data',
    core.serialization.string().optional(),
  ),
  canvasMsgId: core.serialization.property(
    'canvas_msg_id',
    core.serialization.string().optional(),
  ),
  createdBy: core.serialization.property(
    'created_by',
    core.serialization.string().optional(),
  ),
  createdAt: core.serialization.property(
    'created_at',
    core.serialization.date().optional(),
  ),
  updatedAt: core.serialization.property(
    'updated_at',
    core.serialization.date().optional(),
  ),
  deletedAt: core.serialization.property(
    'deleted_at',
    core.serialization.date().optional(),
  ),
  markedAsSpamAt: core.serialization.property(
    'marked_as_spam_at',
    core.serialization.date().optional(),
  ),
  discordMeta: core.serialization.property(
    'discord_meta',
    GetCommentsResponseResultsItemDiscordMeta.optional(),
  ),
  reactionCount: core.serialization.property(
    'reaction_count',
    core.serialization.number(),
  ),
  reactionWeightsSum: core.serialization.property(
    'reaction_weights_sum',
    core.serialization.number().optional(),
  ),
  search: GetCommentsResponseResultsItemSearch,
  address: core.serialization.property(
    'Address',
    GetCommentsResponseResultsItemAddress.optional(),
  ),
  thread: core.serialization.property(
    'Thread',
    GetCommentsResponseResultsItemThread.optional(),
  ),
  reaction: core.serialization.property(
    'Reaction',
    GetCommentsResponseResultsItemReaction.optional(),
  ),
  commentVersionHistories: core.serialization.property(
    'CommentVersionHistories',
    core.serialization
      .list(GetCommentsResponseResultsItemCommentVersionHistoriesItem)
      .optional(),
  ),
});
