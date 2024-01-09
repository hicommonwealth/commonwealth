import { AppError } from '@hicommonwealth/adapters';
import { verifyComment } from '../../../shared/canvas/serverVerify';
import { CommentInstance } from '../../models/comment';
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
  req: TypedRequest<CreateThreadCommentRequestBody, null, { id: string }>,
  res: TypedResponse<CreateThreadCommentResponse>,
) => {
  const { user, address, chain: community } = req;
  const { id: threadId } = req.params;
  const {
    parent_id: parentId,
    text,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
    discord_meta,
  } = req.body;

  if (!threadId) {
    throw new AppError(Errors.MissingThreadId);
  }
  if (!text || !text.trim()) {
    throw new AppError(Errors.MissingText);
  }

  if (process.env.ENFORCE_SESSION_KEYS === 'true') {
    await verifyComment(canvasAction, canvasSession, canvasHash, {
      thread_id: parseInt(threadId, 10),
      text,
      address: address.address,
      chain: community.id,
      parent_comment_id: parentId,
    });
  }

  const [comment, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadComment({
      user,
      address,
      community,
      parentId,
      threadId: parseInt(threadId, 10),
      text,
      canvasAction,
      canvasSession,
      canvasHash,
      discordMeta: discord_meta,
    });

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, comment);
};
