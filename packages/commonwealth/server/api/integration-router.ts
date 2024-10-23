import { express } from '@hicommonwealth/adapters';
import { AppError } from '@hicommonwealth/core';
import { ChainEvents, Snapshot } from '@hicommonwealth/model';
import { Router, raw } from 'express';
import { config } from '../config';

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

  router.post(
    '/snapshot/webhook',
    (req, _, next) => {
      const headerSecret = req.headers['authentication'];
      if (
        config.SNAPSHOT_WEBHOOK_SECRET &&
        headerSecret !== config.SNAPSHOT_WEBHOOK_SECRET
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
