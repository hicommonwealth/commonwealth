import {
  HotShotsStats,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { schemas, stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { fetchNewSnapshotProposal, models } from '@hicommonwealth/model';
import type { Request, RequestHandler, Response } from 'express';
import express, { json } from 'express';
import { fileURLToPath } from 'url';
import v8 from 'v8';
import { DEFAULT_PORT } from './config';
import {
  methodNotAllowedMiddleware,
  registerRoute,
} from './utils/methodNotAllowed';

let isServiceHealthy = false;

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
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

registerRoute(app, 'get', '/', (req: Request, res: Response) => {
  res.send('OK!');
});

registerRoute(app, 'post', '/snapshot', async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      log.error('No event found in request body');
      res.status(400).send('Error sending snapshot event');
    }

    log.info('Snapshot received', { requestBody: req.body });

    const parsedId = req.body.id?.replace(/.*\//, '');
    const eventType = req.body.event?.split('/')[1];

    if (!parsedId || !eventType) {
      log.error('No id or event in request body', undefined, {
        requestBody: req.body,
      });
      res.status(400).send('Error sending snapshot event');
    }

    const response = await fetchNewSnapshotProposal(parsedId);

    const space = response.data.proposal?.space.id;

    if (!space) {
      log.error('Space not defined!');
      return res.status(400).send('Error getting snapshot space');
    }

    const associatedCommunities = await models.CommunitySnapshotSpaces.count({
      where: { snapshot_space_id: space },
    });

    if (associatedCommunities === 0) {
      log.info(`No associated communities found for space ${space}`);
      return res.status(200).json({ message: 'No associated community' });
    }

    await models.Outbox.create({
      event_name: schemas.EventNames.SnapshotProposalCreated,
      event_payload: {
        id: parsedId,
        event: req.body.event,
        title: response.data.proposal?.title ?? null,
        body: response.data.proposal?.body ?? null,
        choices: response.data.proposal?.choices ?? null,
        space: space ?? null,
        start: response.data.proposal?.start ?? null,
        expire: response.data.proposal?.end ?? null,
        token: req.body.token,
        secret: req.body.secret,
      },
    });

    stats().increment('snapshot_listener.received_snapshot_event', {
      event: eventType,
      space: space,
    });

    res.status(200).send({ message: 'Snapshot event received' });
  } catch (err) {
    log.error('Error sending snapshot event', err);
    res.status(500).send('error: ' + err);
  }
});

app.use(methodNotAllowedMiddleware());

app.listen(port, async () => {
  log.info(`⚡️[server]: Server is running at https://localhost:${port}`);
  isServiceHealthy = true;
});
