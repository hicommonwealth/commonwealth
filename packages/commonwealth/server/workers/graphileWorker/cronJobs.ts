import { CustomCronItem, GraphileQueues, GraphileTasks } from './types';

const cleanSubscriptionsCronItem: CustomCronItem = {
  task: GraphileTasks.CleanSubscriptions,
  match: '0 8 * * *', // 8 AM everyday
  options: {
    backfillPeriod: 0,
    maxAttempts: 3,
    queueName: GraphileQueues.CleanSubscriptions,
  },
};

const cleanChainEventXpSourcesCronItem: CustomCronItem = {
  task: GraphileTasks.CleanChainEventXpSources,
  match: '0 9 * * *', // 9 AM everyday
  options: {
    backfillPeriod: 0,
    maxAttempts: 3,
    queueName: GraphileQueues.CleanChainEventXpSources,
  },
};

const archiveOutboxCronItem: CustomCronItem = {
  task: GraphileTasks.ArchiveOutbox,
  match: '0 10 * * *', // 10 AM everyday
  options: {
    backfillPeriod: 0,
    maxAttempts: 3,
    queueName: GraphileQueues.ArchiveOutbox,
  },
};

const runDbMaintenanceCronItem: CustomCronItem = {
  task: GraphileTasks.RunDbMaintenance,
  match: '0 11 * * *', // 11 AM everyday
  options: {
    backfillPeriod: 0,
    maxAttempts: 3,
    queueName: GraphileQueues.RunDbMaintenance,
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
  cleanSubscriptionsCronItem,
  cleanChainEventXpSourcesCronItem,
  runDbMaintenanceCronItem,
];
