import { TypedRequest, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CommentInstance } from '../../models/comment';
import { AppError } from '../../../../common-common/src/errors';

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
  bot_meta;
};
type CreateThreadCommentResponse = CommentInstance;

export const createThreadCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<CreateThreadCommentRequestBody, null, { id: string }>,
  res: TypedResponse<CreateThreadCommentResponse>
) => {
  const { user, address, chain } = req;
  const { id: threadId } = req.params;
  const {
    parent_id: parentId,
    text,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
    bot_meta,
  } = req.body;

  if (!threadId) {
    throw new AppError(Errors.MissingThreadId);
  }
  if (!text || !text.trim()) {
    throw new AppError(Errors.MissingText);
  }

  const [comment, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadComment({
      user,
      address,
      chain,
      parentId,
      threadId: parseInt(threadId, 10),
      text,
      canvasAction,
      canvasSession,
      canvasHash,
      botMeta: bot_meta,
    });

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, comment);
};
