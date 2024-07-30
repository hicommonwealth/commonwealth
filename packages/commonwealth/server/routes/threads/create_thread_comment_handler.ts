import { AppError } from '@hicommonwealth/core';
import { CommentInstance } from '@hicommonwealth/model';

import {
  addressSwapper,
  applyCanvasSignedData,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyComment,
} from '@hicommonwealth/shared';
import { canvas } from 'server';
import { CreateThreadCommentOptions } from 'server/controllers/server_threads_methods/create_thread_comment';
import { config } from '../../config';
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
};
type CreateThreadCommentResponse = CommentInstance;

export const createThreadCommentHandler = async (
  controllers: ServerControllers,
  // @ts-expect-error StrictNullChecks
  req: TypedRequest<CreateThreadCommentRequestBody, null, { id: string }>,
  res: TypedResponse<CreateThreadCommentResponse>,
) => {
  const { user, address } = req;
  // @ts-expect-error StrictNullChecks
  const { id: threadId } = req.params;
  // @ts-expect-error <StrictNullChecks>
  const { parent_id: parentId, text, discord_meta } = req.body;

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
    // @ts-expect-error <StrictNullChecks>
    threadId: parseInt(threadId, 10) || undefined,
    text,
    discordMeta: discord_meta,
  };

  if (hasCanvasSignedDataApiArgs(req.body)) {
    threadCommentFields.canvasSignedData = req.body.canvas_signed_data;
    threadCommentFields.canvasMsgId = req.body.canvas_msg_id;

    if (config.ENFORCE_SESSION_KEYS) {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
      const canvasComment = {
        thread_id: parseInt(threadId, 10) || undefined,
        text,
        address:
          canvasSignedData.actionMessage.payload.did.split(':')[0] == 'polkadot'
            ? addressSwapper({
                currentPrefix: 42,
                // @ts-expect-error <StrictNullChecks>
                address: address.address,
              })
            : // @ts-expect-error <StrictNullChecks>
              address.address,
        parent_comment_id: parentId,
      };
      await verifyComment(canvasSignedData, canvasComment);
    }
  }

  // create thread comment
  const [comment, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadComment(threadCommentFields);

  // publish signed data
  if (hasCanvasSignedDataApiArgs(req.body)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    await applyCanvasSignedData(canvas, canvasSignedData);
  }

  // emit notifications
  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  // track analytics events
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, comment);
};
