import { express } from '@hicommonwealth/adapters';
import { ChainEvents, Comment, Thread, models } from '@hicommonwealth/model';
import { RequestHandler, Router, raw } from 'express';
import DatabaseValidationService from 'server/middleware/databaseValidationService';

const PATH = '/api/integration';

async function withThreadId(req, _, next) {
  try {
    const message_id = req.params.message_id;
    const thread = await models.Thread.findOne({
      where: {
        discord_meta: { message_id },
        deleted_at: null,
      },
      attributes: ['id'],
    });
    if (!thread) throw new Error(`Thread not found for message ${message_id}`);
    req.body.thread_id = thread.id;
    return next();
  } catch (e) {
    next(e);
  }
}

async function withCommentId(req, _, next) {
  try {
    const message_id = req.params.message_id;
    const comment = await models.Comment.findOne({
      where: {
        discord_meta: { message_id },
        deleted_at: null,
      },
      attributes: ['id'],
    });
    if (!comment)
      throw new Error(`Comment not found for message ${message_id}`);
    req.body.comment_id = comment.id;
    return next();
  } catch (e) {
    next(e);
  }
}

function build(validator: DatabaseValidationService) {
  // Async middleware wrappers
  const isBotUser: RequestHandler = (req, res, next) => {
    validator.validateBotUser(req, res, next).catch(next);
  };

  const router = Router();
  router.use(express.statsMiddleware);

  // Chain Events integration
  router.post(
    '/chainevent/ChainEventCreated/:id',
    raw({ type: '*/*', limit: '10mb', inflate: true }),
    (req, _, next) => {
      ChainEvents.verifyAlchemySignature(req);
      return next();
    },
    // parse body as JSON (native express.json middleware doesn't work here)
    (req, _, next) => {
      req.body = JSON.parse(req.body);
      next();
    },
    express.command(ChainEvents.ChainEventCreated()),
  );

  // Discord BOT integration
  router.post(
    '/bot/threads',
    isBotUser,
    express.command(Thread.CreateThread()),
  );

  router.patch(
    '/bot/threads/:message_id',
    isBotUser,
    withThreadId,
    express.command(Thread.UpdateThread()),
  );

  router.delete(
    '/bot/threads/:message_id',
    isBotUser,
    withThreadId,
    express.command(Thread.DeleteThread()),
  );

  router.post(
    '/bot/threads/:message_id/comments',
    isBotUser,
    withThreadId,
    express.command(Comment.CreateComment()),
  );

  router.patch(
    '/bot/comments/:message_id',
    isBotUser,
    withCommentId,
    express.command(Comment.UpdateComment()),
  );

  router.delete(
    '/bot/comments/:message_id',
    isBotUser,
    withCommentId,
    express.command(Comment.DeleteComment()),
  );

  return router;
}

export { PATH, build };
