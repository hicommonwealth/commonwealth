import {
  HotShotsStats,
  PinoLogger,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  getRabbitMQConfig,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  Broker,
  BrokerTopics,
  EventContext,
  broker,
  logger,
  stats,
} from '@hicommonwealth/core';
import type { Request, RequestHandler, Response } from 'express';
import express, { json } from 'express';
import v8 from 'v8';
import { DEFAULT_PORT, NODE_ENV, RABBITMQ_URI } from './config';
import fetchNewSnapshotProposal from './utils/fetchSnapshot';
import {
  methodNotAllowedMiddleware,
  registerRoute,
} from './utils/methodNotAllowed';

let isServiceHealthy = false;

const log = logger(PinoLogger()).getLogger(__filename);
stats(HotShotsStats());

startHealthCheckLoop({
  service: ServiceKey.SnapshotListener,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000,
  )} GB`,
);

export const app = express();
const port = process.env.PORT || DEFAULT_PORT;
app.use(json() as RequestHandler);

let controller: Broker;

registerRoute(app, 'get', '/', (req: Request, res: Response) => {
  res.send('OK!');
});

registerRoute(app, 'post', '/snapshot', async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      log.error('No event found in request body');
      res.status(400).send('Error sending snapshot event');
    }

    log.debug('Snapshot received', undefined, { requestBody: req.body });

    const parsedId = req.body.id?.replace(/.*\//, '');
    const eventType = req.body.event?.split('/')[1];

    if (!parsedId || !eventType) {
      log.error('No id or event in request body', undefined, {
        requestBody: req.body,
      });
      res.status(400).send('Error sending snapshot event');
    }

    const response = await fetchNewSnapshotProposal(parsedId, eventType);

    const event: EventContext<'SnapshotProposalCreated'> = {
      name: 'SnapshotProposalCreated',
      payload: {
        id: parsedId,
        title: response.data.proposal?.title ?? null,
        body: response.data.proposal?.body ?? null,
        choices: response.data.proposal?.choices ?? null,
        space: response.data.proposal?.space.id ?? null,
        start: response.data.proposal?.start ?? null,
        expire: response.data.proposal?.end ?? null,
      },
    };

    const result = await controller?.publish(
      BrokerTopics.SnapshotListener,
      event,
    );

    if (!result) {
      log.error('Failed to publish snapshot message', undefined, {
        event,
      });
      res.status(500).send('Failed to publish snapshot');
    }

    stats().increment('snapshot_listener.received_snapshot_event', {
      event: eventType,
      space: event.payload.space,
    });

    res.status(200).send({ message: 'Snapshot event received', event });
  } catch (err) {
    log.error('Error sending snapshot event', err);
    res.status(500).send('error: ' + err);
  }
});

app.use(methodNotAllowedMiddleware());

app.listen(port, async () => {
  const log = logger().getLogger(__filename);
  log.info(`⚡️[server]: Server is running at https://localhost:${port}`);

  if (NODE_ENV !== 'test') {
    try {
      const rmqAdapter = new RabbitMQAdapter(
        getRabbitMQConfig(RABBITMQ_URI, RascalConfigServices.SnapshotService),
      );
      await rmqAdapter.init();
      broker(rmqAdapter);
      controller = rmqAdapter;
      isServiceHealthy = true;
    } catch (err) {
      log.fatal(`Error starting server: ${err}`);
      isServiceHealthy = false;
    }
  }
});
