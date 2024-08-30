import { AppError } from '@hicommonwealth/core';
import { CommentInstance } from '@hicommonwealth/model';

import {
  addressSwapper,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyComment,
} from '@hicommonwealth/shared';
import { CreateThreadCommentOptions } from 'server/controllers/server_threads_methods/create_thread_comment';
import { applyCanvasSignedData } from 'server/federation';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

export const Errors = {
  MissingThreadId: 'Must provide valid thread_id',
  MissingText: 'Must provide text',

  MissingRootId: 'Must provide valid thread_id',
  InvalidParent: 'Invalid parent',
  ThreadNotFound: 'Cannot comment; thread not found',
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  InsufficientTokenBalance:
    "Users need to hold some of the community's tokens to comment",
  BalanceCheckFailed: 'Could not verify user token balance',
  NestingTooDeep: 'Comments can only be nested 8 levels deep',
};

type CreateThreadCommentRequestBody = {
  parent_id;
  thread_id;
  text;
  discord_meta;
  thread_msg_id;
  parent_comment_msg_id;
};
type CreateThreadCommentResponse = CommentInstance;

export const createThreadCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<CreateThreadCommentRequestBody, {}, { id: string }>,
  res: TypedResponse<CreateThreadCommentResponse>,
) => {
  const { user, address } = req;

  if (req.params === undefined) throw new Error('validation error');
  if (req.body === undefined) throw new Error('validation error');

  const { id: threadId } = req.params;
  const {
    parent_id: parentId,
    thread_msg_id: threadMsgId,
    parent_comment_msg_id: parentCommentMsgId,
    text,
    discord_meta,
  } = req.body;

  if (!threadId) {
    throw new AppError(Errors.MissingThreadId);
  }
  if (!text || !text.trim()) {
    throw new AppError(Errors.MissingText);
  }

  const threadCommentFields: CreateThreadCommentOptions = {
    // @ts-expect-error <StrictNullChecks>
    user,
    // @ts-expect-error <StrictNullChecks>
    address,
    parentId,
    threadId: parseInt(threadId, 10),
    text,
    discordMeta: discord_meta,
  };

  if (hasCanvasSignedDataApiArgs(req.body)) {
    threadCommentFields.canvasSignedData = req.body.canvas_signed_data;
    threadCommentFields.canvasMsgId = req.body.canvas_msg_id;

    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    const canvasComment = {
      thread_id: threadMsgId ?? null,
      text,
      address:
        canvasSignedData.actionMessage.payload.did.split(':')[2] == 'polkadot'
          ? addressSwapper({
              currentPrefix: 42,
              // @ts-expect-error <StrictNullChecks>
              address: address.address,
            })
          : // @ts-expect-error <StrictNullChecks>
            address.address,
      parent_comment_id: parentCommentMsgId ?? null,
    };
    await verifyComment(canvasSignedData, canvasComment);
  }

  const [comment, analyticsOptions] =
    await controllers.threads.createThreadComment(threadCommentFields);

  // publish signed data
  if (hasCanvasSignedDataApiArgs(req.body)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    await applyCanvasSignedData(canvasSignedData);
  }

  // track analytics events
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, comment);
};
