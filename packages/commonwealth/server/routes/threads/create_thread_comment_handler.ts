import { AppError } from '@hicommonwealth/core';
import { CommentInstance } from '@hicommonwealth/model';
import { CreateThreadCommentOptions } from 'server/controllers/server_threads_methods/create_thread_comment';
import { isCanvasSignedDataApiArgs } from 'shared/canvas/types';
import { verifyComment } from '../../../shared/canvas/serverVerify';
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
  req: TypedRequest<CreateThreadCommentRequestBody, null, { id: string }>,
  res: TypedResponse<CreateThreadCommentResponse>,
) => {
  const { user, address } = req;
  const { id: threadId } = req.params;
  const { parent_id: parentId, text, discord_meta } = req.body;

  if (!threadId) {
    throw new AppError(Errors.MissingThreadId);
  }
  if (!text || !text.trim()) {
    throw new AppError(Errors.MissingText);
  }

  const threadCommentFields: CreateThreadCommentOptions = {
    user,
    address,
    parentId,
    threadId: parseInt(threadId, 10) || undefined,
    text,
    discordMeta: discord_meta,
  };

  if (isCanvasSignedDataApiArgs(req.body)) {
    threadCommentFields.canvasActionMessage = req.body.canvas_action_message;
    threadCommentFields.canvasActionMessageSignature =
      req.body.canvas_action_message_signature;
    threadCommentFields.canvasSessionMessage = req.body.canvas_session_message;
    threadCommentFields.canvasSessionMessageSignature =
      req.body.canvas_session_message_signature;

    if (process.env.ENFORCE_SESSION_KEYS === 'true') {
      await verifyComment(req.body, {
        thread_id: parseInt(threadId, 10) || undefined,
        text,
        address: address.address,
        parent_comment_id: parentId,
      });
    }
  }

  const [comment, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadComment(threadCommentFields);

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, comment);
};
