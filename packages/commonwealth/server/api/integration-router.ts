import { express } from '@hicommonwealth/adapters';
import { ChainEvents, Contest, config } from '@hicommonwealth/model';
import { Router, raw } from 'express';
import farcasterRouter from 'server/farcaster/router';

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
    router.use('/farcaster/contests', farcasterRouter);

    // Farcaster webhooks/actions
    router.post(
      '/farcaster/CastCreated',
      express.command(Contest.FarcasterCastCreatedWebhook()),
    );

    router.post(
      '/farcaster/ReplyCastCreated',
      express.command(Contest.FarcasterReplyCastCreatedWebhook()),
    );

    router.get(
      '/farcaster/CastUpvoteAction',
      express.query(Contest.GetFarcasterUpvoteActionMetadata()),
    );

    router.post(
      '/farcaster/CastUpvoteAction',
      express.command(Contest.FarcasterUpvoteAction()),
    );
  }

  return router;
}

export { PATH, build };
