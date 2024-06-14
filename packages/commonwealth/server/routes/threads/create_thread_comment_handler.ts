import { AppError } from '@hicommonwealth/core';
import { CommentInstance } from '@hicommonwealth/model';
import { verifyComment } from '../../../shared/canvas/serverVerify';
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
  canvas_action;
  canvas_session;
  canvas_hash;
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
  const {
    // @ts-expect-error StrictNullChecks
    parent_id: parentId,
    // @ts-expect-error StrictNullChecks
    text,
    // @ts-expect-error StrictNullChecks
    canvas_action: canvasAction,
    // @ts-expect-error StrictNullChecks
    canvas_session: canvasSession,
    // @ts-expect-error StrictNullChecks
    canvas_hash: canvasHash,
    // @ts-expect-error StrictNullChecks
    discord_meta,
  } = req.body;

  if (!threadId) {
    throw new AppError(Errors.MissingThreadId);
  }
  if (!text || !text.trim()) {
    throw new AppError(Errors.MissingText);
  }

  if (config.ENFORCE_SESSION_KEYS) {
    await verifyComment(canvasAction, canvasSession, canvasHash, {
      thread_id: parseInt(threadId, 10) || undefined,
      text,
      // @ts-expect-error StrictNullChecks
      address: address.address,
      parent_comment_id: parentId,
    });
  }

  const [comment, analyticsOptions] =
    await controllers.threads.createThreadComment({
      // @ts-expect-error StrictNullChecks
      user,
      // @ts-expect-error StrictNullChecks
      address,
      parentId,
      // @ts-expect-error StrictNullChecks
      threadId: parseInt(threadId, 10) || undefined,
      text,
      canvasAction,
      canvasSession,
      canvasHash,
      discordMeta: discord_meta,
    });

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, comment);
};
