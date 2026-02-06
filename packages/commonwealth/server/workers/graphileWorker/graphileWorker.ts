import {
  HotShotsStats,
  RedisCache,
  S3BlobStorage,
} from '@hicommonwealth/adapters';
import {
  blobStorage,
  cache,
  disableService,
  dispose,
  logger,
  stats,
} from '@hicommonwealth/core';
import {
  CustomCronItem,
  GraphileTaskNames,
  preset,
} from '@hicommonwealth/model/services';
import { Runner, Task, parseCronItems, run } from 'graphile-worker';
import { config } from '../../config';
import { cronItems } from './cronJobs';
import { graphileTasks, taskFactory } from './tasks';

const log = logger(import.meta);

export interface GraphileWorkerOptions {
  initAdapters?: boolean;
  onRunnerCreated?: (runner: Runner) => void;
}

export async function startGraphileWorker(
  options: GraphileWorkerOptions | boolean = false,
) {
  // Support legacy boolean parameter for backwards compatibility
  const { initAdapters, onRunnerCreated } =
    typeof options === 'boolean' ? { initAdapters: options } : options;

  await disableService();
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
    if (cronJob && !graphileTasks[cronJob.task])
      throw new Error(`Cron job task not found: ${cronJob.task}`);
  }

  const runner = await run({
    parsedCronItems: parseCronItems(
      cronItems.filter((x): x is CustomCronItem => x !== undefined),
    ),
    preset,
    taskList: Object.entries(graphileTasks).reduce(
      (acc, [taskName, task]) => ({
        ...acc,
        [taskName]: taskFactory(task),
      }),
      {} as Record<GraphileTaskNames, Task>,
    ),
  });

  // Allow caller to register the runner for lifecycle management
  onRunnerCreated?.(runner);

  log.info('Graphile Worker started');
  return runner;
}

if (import.meta.url.endsWith(process.argv[1])) {
  startGraphileWorker({ initAdapters: true }).catch((err) => {
    log.fatal('A fatal error occurred with the Graphile Worker', err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
}
