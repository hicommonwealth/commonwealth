import type { Request, Response } from 'express';
import express from 'express';
import type { ISnapshotNotification } from 'common-common/src/types';
import {
  RascalPublications,
  RabbitMQController,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';
import fetchNewSnapshotProposal from './utils/fetchSnapshot';
import { factory, formatFilename } from 'common-common/src/logging';
import { DEFAULT_PORT, RABBITMQ_URI } from './config';
import { StatsDController } from 'common-common/src/statsd';
import v8 from 'v8';
import {methodNotAllowedMiddleware, registerRoute} from "./utils/methodNotAllowed";

const log = factory.getLogger(formatFilename(__filename));

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000
  )} GB`
);

const app = express();
const port = process.env.PORT || DEFAULT_PORT;
app.use(express.json());

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

    await controller.publish(event, RascalPublications.SnapshotListener);

    StatsDController.get().increment(
      'snapshot_listener.received_snapshot_event',
      1,
      {
        event: eventType,
        space: event.space,
      }
    );

    res.status(200).send({ message: 'Snapshot event received', event });
  } catch (err) {
    log.error('Error sending snapshot event', err);
    res.status(500).send('error: ' + err);
  }
});

app.use(methodNotAllowedMiddleware());

app.listen(port, async () => {
  const log = factory.getLogger(formatFilename(__filename));
  log.info(`⚡️[server]: Server is running at https://localhost:${port}`);

  try {
    controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));
    await controller.init();
    log.info('Connected to RabbitMQ');
  } catch (err) {
    log.error(`Error starting server: ${err}`);
  }
  app.bind;
});
