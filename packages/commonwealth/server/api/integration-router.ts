import { express } from '@hicommonwealth/adapters';
import { ChainEvents, Thread } from '@hicommonwealth/model';
import { Router, raw } from 'express';

// TODO: remove as we migrate to tRPC commands
import DatabaseValidationService from 'server/middleware/databaseValidationService';
import { deleteBotCommentHandler } from 'server/routes/comments/delete_comment_bot_handler';
import { updateCommentHandler } from 'server/routes/comments/update_comment_handler';
import { createThreadCommentHandler } from 'server/routes/threads/create_thread_comment_handler';
import { deleteBotThreadHandler } from 'server/routes/threads/delete_thread_bot_handler';
import { updateThreadHandler } from 'server/routes/threads/update_thread_handler';
import { ServerControllers } from 'server/routing/router';

// TODO: change path to /integration after reviwing existing requests to these endpoints
const PATH = '/';

function build(
  controllers: ServerControllers,
  validator: DatabaseValidationService,
) {
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
  const BOT_PATH = '/api/bot'; // TODO: change to /integration/both
  router.post(
    `${BOT_PATH}/threads`,
    validator.validateBotUser,
    express.command(Thread.CreateThread()),
  );

  router.patch(
    `${BOT_PATH}/threads`,
    validator.validateBotUser,
    validator.validateAuthor,
    updateThreadHandler.bind(this, controllers),
  );

  router.delete(
    `${BOT_PATH}/threads/:message_id`,
    validator.validateBotUser,
    deleteBotThreadHandler.bind(this, controllers),
  );

  router.post(
    `${BOT_PATH}/threads/:id/comments`,
    validator.validateBotUser,
    validator.validateAuthor,
    createThreadCommentHandler.bind(this, controllers),
  );

  router.patch(
    `${BOT_PATH}/threads/:id/comments`,
    validator.validateBotUser,
    validator.validateAuthor,
    updateCommentHandler.bind(this, controllers),
  );

  router.delete(
    `${BOT_PATH}/comments/:message_id`,
    validator.validateBotUser,
    validator.validateAuthor,
    deleteBotCommentHandler.bind(this, controllers),
  );

  return router;
}

export { PATH, build };
