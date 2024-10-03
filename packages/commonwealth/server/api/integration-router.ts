import { express } from '@hicommonwealth/adapters';
import { ChainEvents } from '@hicommonwealth/model';
import { Router, raw } from 'express';

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

  return router;
}

export { PATH, build };
