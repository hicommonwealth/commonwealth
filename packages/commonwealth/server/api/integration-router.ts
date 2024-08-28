import { express } from '@hicommonwealth/adapters';
import { ChainEvents, Thread } from '@hicommonwealth/model';
import { RequestHandler, Router, raw } from 'express';

// TODO: remove as we migrate to tRPC commands
import DatabaseValidationService from 'server/middleware/databaseValidationService';
import { deleteBotCommentHandler } from 'server/routes/comments/delete_comment_bot_handler';
import { updateCommentHandler } from 'server/routes/comments/update_comment_handler';
import { createThreadCommentHandler } from 'server/routes/threads/create_thread_comment_handler';
import { deleteBotThreadHandler } from 'server/routes/threads/delete_thread_bot_handler';
import { updateThreadHandler } from 'server/routes/threads/update_thread_handler';
import { ServerControllers } from 'server/routing/router';

const PATH = '/api/integration';

function build(
  controllers: ServerControllers,
  validator: DatabaseValidationService,
) {
  // Async middleware wrappers
  const isBotUser: RequestHandler = (req, res, next) => {
    validator.validateBotUser(req, res, next).catch(next);
  };
  const isAuthor: RequestHandler = (req, res, next) => {
    validator.validateAuthor(req, res, next).catch(next);
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
    '/bot/threads',
    isBotUser,
    isAuthor,
    updateThreadHandler.bind(this, controllers),
  );

  router.delete(
    '/bot/threads/:message_id',
    isBotUser,
    deleteBotThreadHandler.bind(this, controllers),
  );

  router.post(
    '/bot/threads/:id/comments',
    isBotUser,
    isAuthor,
    createThreadCommentHandler.bind(this, controllers),
  );

  router.patch(
    '/bot/threads/:id/comments',
    isBotUser,
    isAuthor,
    updateCommentHandler.bind(this, controllers),
  );

  router.delete(
    '/bot/comments/:message_id',
    isBotUser,
    isAuthor,
    deleteBotCommentHandler.bind(this, controllers),
  );

  return router;
}

export { PATH, build };
