import { express } from '@hicommonwealth/adapters';
import { ChainEvents, Comment, Thread } from '@hicommonwealth/model';
import { RequestHandler, Router, raw } from 'express';
import DatabaseValidationService from 'server/middleware/databaseValidationService';

const PATH = '/api/integration';

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
    '/bot/threads',
    isBotUser,
    express.command(Thread.UpdateThread()),
  );

  router.delete(
    '/bot/threads/:message_id',
    isBotUser,
    express.command(Thread.DeleteThread()),
  );

  router.post(
    '/bot/threads/:id/comments',
    isBotUser,
    express.command(Comment.CreateComment()),
  );

  router.patch(
    '/bot/threads/:id/comments',
    isBotUser,
    express.command(Comment.UpdateComment()),
  );

  router.delete(
    '/bot/comments/:message_id',
    isBotUser,
    express.command(Comment.DeleteComment()),
  );

  return router;
}

export { PATH, build };
