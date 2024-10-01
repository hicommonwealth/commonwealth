import { express } from '@hicommonwealth/adapters';
import {
  ChainEvents,
  Comment,
  Contest,
  Thread,
  models,
} from '@hicommonwealth/model';
import { RequestHandler, Router, raw } from 'express';
import DatabaseValidationService from 'server/middleware/databaseValidationService';

const PATH = '/api/integration';

function withThreadId(req, _, next) {
  const message_id = req.params.message_id;
  void models.Thread.findOne({
    where: {
      discord_meta: { message_id },
      deleted_at: null,
    },
    attributes: ['id'],
  })
    .then((thread) => {
      if (!thread)
        throw new Error(`Thread not found for message ${message_id}`);
      req.body.thread_id = thread.id;
      next();
    })
    .catch(next);
}

function withCommentId(req, _, next) {
  const message_id = req.params.message_id;
  void models.Comment.findOne({
    where: {
      discord_meta: { message_id },
      deleted_at: null,
    },
    attributes: ['id'],
  })
    .then((comment) => {
      if (!comment)
        throw new Error(`Comment not found for message ${message_id}`);
      req.body.comment_id = comment.id;
      next();
    })
    .catch(next);
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

  // Farcaster webhooks
  router.post(
    '/farcaster/CastCreated',
    (req, _, next) => {
      console.log('CastCreated BODY: ', JSON.stringify(req.body, null, 2));
      next();
    },
    express.command(Contest.FarcasterCastCreatedWebhook()),
  );

  router.post(
    '/farcaster/ReplyCastCreated',
    (req, _, next) => {
      console.log('ReplyCastCreated BODY: ', JSON.stringify(req.body, null, 2));
      next();
    },
    express.command(Contest.FarcasterReplyCastCreatedWebhook()),
  );

  // router.post(
  //   '/farcaster/action',
  //   raw({ type: '*/*', limit: '10mb', inflate: true }),
  //   (req, _, next) => {
  //     // TODO: verify frame signature message
  //     return next();
  //   },
  //   // parse body as JSON (native express.json middleware doesn't work here)
  //   (req, _, next) => {
  //     req.body = JSON.parse(req.body);
  //     next();
  //   },
  //   express.command(Contest.FarcasterActionWebhook()),
  // );

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
