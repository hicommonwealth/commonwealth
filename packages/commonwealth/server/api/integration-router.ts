import { express } from '@hicommonwealth/adapters';
import { AppError } from '@hicommonwealth/core';
import { ChainEvents, Contest, Snapshot, config } from '@hicommonwealth/model';
import { Router, raw } from 'express';
import farcasterRouter from 'server/farcaster/router';
import { validateFarcasterAction } from 'server/middleware/validateFarcasterAction';
import { validateNeynarWebhook } from 'server/middleware/validateNeynarWebhook';
import { config as serverConfig } from '../config';

const PATH = '/api/integration';

function build() {
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

  if (config.CONTESTS.FLAG_FARCASTER_CONTEST) {
    // Farcaster frames
    // WARNING: do not change this because cloudflare may route to it
    router.use('/farcaster/contests', farcasterRouter);

    // Farcaster webhooks/actions
    router.post(
      '/farcaster/CastCreated',
      (req, _, next) => {
        validateNeynarWebhook(
          config.CONTESTS.NEYNAR_CAST_CREATED_WEBHOOK_SECRET,
        )(req, _, next).catch(next);
      },
      express.command(Contest.FarcasterCastCreatedWebhook()),
    );

    router.post(
      '/farcaster/ReplyCastCreated',
      (req, _, next) => {
        validateNeynarWebhook(null)(req, _, next).catch(next);
      },
      express.command(Contest.FarcasterReplyCastCreatedWebhook()),
    );

    router.get(
      '/farcaster/CastUpvoteAction',
      express.query(Contest.GetFarcasterUpvoteActionMetadata()),
    );

    router.post(
      '/farcaster/CastUpvoteAction',
      (req, _, next) => {
        validateFarcasterAction()(req, _, next).catch(next);
      },
      express.command(Contest.FarcasterUpvoteAction()),
    );

    router.post(
      '/farcaster/NotificationsWebhook',
      // TODO: add validation middleware
      express.command(Contest.FarcasterNotificationsWebhook()),
    );
  }

  router.post(
    '/snapshot/webhook',
    (req, _, next) => {
      const headerSecret = req.headers['authentication'];
      if (
        serverConfig.SNAPSHOT_WEBHOOK_SECRET &&
        headerSecret !== serverConfig.SNAPSHOT_WEBHOOK_SECRET
      ) {
        throw new AppError('Unauthorized', 401);
      }
      return next();
    },
    express.command(Snapshot.CreateSnapshotProposal()),
  );

  return router;
}

export { PATH, build };
