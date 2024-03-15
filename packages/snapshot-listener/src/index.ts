import {
  HotShotsStats,
  PinoLogger,
  RabbitMQController,
  RascalConfigServices,
  RascalPublications,
  ServiceKey,
  getRabbitMQConfig,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  logger,
  stats,
  type ISnapshotNotification,
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

let controller: RabbitMQController;

registerRoute(app, 'get', '/', (req: Request, res: Response) => {
  res.send('OK!');
});

registerRoute(app, 'post', '/snapshot', async (req: Request, res: Response) => {
  try {
    const event: ISnapshotNotification = req.body;
    if (!event) {
      log.error('No event found in request body');
      res.status(500).send('Error sending snapshot event');
    }

    if (process.env.LOG_LEVEL === 'debug') {
      const eventLog = JSON.stringify(event);
      log.info('snapshot received');
      log.info(eventLog);
    }

    const parsedId = event.id.replace(/.*\//, '');
    const eventType = event.event.split('/')[1];
    const response = await fetchNewSnapshotProposal(parsedId, eventType);
    event.id = parsedId;
    event.title = response.data.proposal?.title ?? null;
    event.body = response.data.proposal?.body ?? null;
    event.choices = response.data.proposal?.choices ?? null;
    event.space = response.data.proposal?.space.id ?? null;
    event.start = response.data.proposal?.start ?? null;
    event.expire = response.data.proposal?.end ?? null;

    await controller?.publish(event, RascalPublications.SnapshotListener);

    stats().increment('snapshot_listener.received_snapshot_event', {
      event: eventType,
      space: event.space,
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

  if (NODE_ENV != 'test') {
    try {
      controller = new RabbitMQController(
        getRabbitMQConfig(RABBITMQ_URI, RascalConfigServices.SnapshotService),
      );
      await controller.init();
      log.info('Connected to RabbitMQ');
    } catch (err) {
      log.error(`Error starting server: ${err}`);
    }
  }

  isServiceHealthy = true;
});
