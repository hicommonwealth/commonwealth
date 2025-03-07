import { CronItem } from 'graphile-worker';
import { GraphileQueues, GraphileTasks } from './types';

type CustomCronItem = CronItem & {
  task: GraphileTasks;
};

const archiveOutboxCronItem: CustomCronItem = {
  task: GraphileTasks.ArchiveOutbox,
  match: (timestampDigest) => {
    return timestampDigest.min === 33;
  },
  options: {
    backfillPeriod: 0,
    maxAttempts: 1,
    queueName: GraphileQueues.ArchiveOutbox,
  },
};

export const cronItems: Array<CustomCronItem> = [archiveOutboxCronItem];
