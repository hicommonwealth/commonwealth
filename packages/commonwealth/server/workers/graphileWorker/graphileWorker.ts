import {
  HotShotsStats,
  RedisCache,
  S3BlobStorage,
} from '@hicommonwealth/adapters';
import {
  blobStorage,
  cache,
  dispose,
  logger,
  stats,
} from '@hicommonwealth/core';
import { GraphileTaskNames, preset } from '@hicommonwealth/model';
import { Task, parseCronItems, run } from 'graphile-worker';
import { config } from '../../config';
import { cronItems } from './cronJobs';
import { graphileTasks, taskFactory } from './tasks';

const log = logger(import.meta);

export async function startGraphileWorker(initAdapters: boolean = false) {
  if (initAdapters) {
    if (!config.CACHE.REDIS_URL) {
      log.warn(
        'REDIS_URL not set. Some Graphile jobs (e.g. CountAggregator) may fail unexpectedly.',
      );
    } else {
      cache({
        adapter: new RedisCache(config.CACHE.REDIS_URL),
      });
    }

    blobStorage({
      adapter: S3BlobStorage(),
    });
    stats({
      adapter: HotShotsStats(),
    });
  }

  for (const cronJob of cronItems) {
    if (!graphileTasks[cronJob.task])
      throw new Error(`Cron job task not found: ${cronJob.task}`);
  }

  await run({
    parsedCronItems: parseCronItems(cronItems),
    preset,
    taskList: Object.entries(graphileTasks).reduce(
      (acc, [taskName, task]) => ({
        ...acc,
        [taskName]: taskFactory<typeof task.input>(task),
      }),
      {} as Record<GraphileTaskNames, Task>,
    ),
  });
  log.info('Graphile Worker started');
}

if (import.meta.url.endsWith(process.argv[1])) {
  startGraphileWorker(true).catch((err) => {
    log.fatal('A fatal error occurred with the Graphile Worker', err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
}
