/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateCommentResponseThreadReactionsItemAddress } from './UpdateCommentResponseThreadReactionsItemAddress';
export const UpdateCommentResponseThreadReactionsItem =
  core.serialization.object({
    id: core.serialization.number().optional(),
    addressId: core.serialization.property(
      'address_id',
      core.serialization.number(),
    ),
    reaction: core.serialization.stringLiteral('like'),
    threadId: core.serialization.property(
      'thread_id',
      core.serialization.number().optional(),
    ),
    commentId: core.serialization.property(
      'comment_id',
      core.serialization.number().optional(),
    ),
    proposalId: core.serialization.property(
      'proposal_id',
      core.serialization.number().optional(),
    ),
    calculatedVotingWeight: core.serialization.property(
      'calculated_voting_weight',
      core.serialization.number().optional(),
    ),
    canvasSignedData: core.serialization.property(
      'canvas_signed_data',
      core.serialization.unknown().optional(),
    ),
    canvasMsgId: core.serialization.property(
      'canvas_msg_id',
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
    address: core.serialization.property(
      'Address',
      UpdateCommentResponseThreadReactionsItemAddress.optional(),
    ),
  });
