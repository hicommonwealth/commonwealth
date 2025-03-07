import { HotShotsStats, S3BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage, dispose, logger, stats } from '@hicommonwealth/core';
import { Task, parseCronItems, run } from 'graphile-worker';
import { cronItems } from './cronJobs';
import { preset } from './graphile.config';
import { graphileTasks, taskFactory } from './tasks';

const log = logger(import.meta);

blobStorage({
  adapter: S3BlobStorage(),
});
stats({
  adapter: HotShotsStats(),
});

async function startGraphileWorker() {
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
        [taskName]: taskFactory(task),
      }),
      {} as Record<string, Task>,
    ),
  });
  log.info('Graphile Worker started');
}

if (import.meta.url.endsWith(process.argv[1])) {
  startGraphileWorker().catch((err) => {
    log.fatal('A fatal error occurred with the Knock Worker', err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
}
