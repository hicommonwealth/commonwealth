import { TypedRequest, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CommentInstance } from '../../models/comment';
import { AppError } from '../../../../common-common/src/errors';

export const Errors = {
  MissingThreadId: 'Must provide valid thread_id',
  MissingTextOrAttachment: 'Must provide text or attachment',

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
    discord_meta
  } = req.body;

  if (!threadId) {
    throw new AppError(Errors.MissingThreadId);
  }
  if (
    (!text || !text.trim()) &&
    (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
  ) {
    throw new AppError(Errors.MissingTextOrAttachment);
  }

  const attachments = req.body['attachments[]'];

  const [comment, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadComment(
      user,
      address,
      chain,
      parentId,
      parseInt(threadId, 10),
      text,
      attachments,
      canvasAction,
      canvasSession,
      canvasHash,
      discord_meta,
    );

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  controllers.analytics.track(analyticsOptions);

  return success(res, comment);
};
