import { CustomCronItem, GraphileQueues, GraphileTasks } from './types';

const archiveOutboxCronItem: CustomCronItem = {
  task: GraphileTasks.ArchiveOutbox,
  match: '0 10 * * *', // 10 AM everyday
  options: {
    backfillPeriod: 0,
    maxAttempts: 3,
    queueName: GraphileQueues.ArchiveOutbox,
  },
};

const updateSitemapCronItem: CustomCronItem = {
  task: GraphileTasks.UpdateSitemap,
  match: '0 * * * *', // every hour
  options: {
    backfillPeriod: 0,
    maxAttempts: 3,
    queueName: GraphileQueues.UpdateSitemap,
  },
};

export const cronItems: Array<CustomCronItem> = [
  archiveOutboxCronItem,
  updateSitemapCronItem,
];
